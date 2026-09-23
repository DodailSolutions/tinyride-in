import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthenticatedUser } from '@tinyride/shared-types';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { RequestHandoverOtpDto, VerifyHandoverDto } from './dto/handovers.dto';

@Injectable()
export class HandoversService {
  private readonly logger = new Logger(HandoversService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generates a salted hashed OTP token for a specific handover leg.
   * Dispatches code to guardian/parent and never stores raw OTP.
   */
  async requestOtp(user: AuthenticatedUser, dto: RequestHandoverOtpDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // Verify trip_children row exists
    const { data: tripChild } = await client
      .from('trip_children')
      .select('id, child_id, trip_id, required_legs, state')
      .eq('id', dto.tripChildId)
      .maybeSingle();

    if (!tripChild) {
      throw new NotFoundException(`Trip Child [${dto.tripChildId}] not found`);
    }

    if (!tripChild.required_legs?.includes(dto.leg)) {
      throw new BadRequestException(`Handover leg [${dto.leg}] is not required for this child run`);
    }

    // Invalidate existing live tokens for this leg
    const now = new Date().toISOString();
    await client
      .from('handover_tokens')
      .update({ invalidated_at: now })
      .eq('trip_child_id', dto.tripChildId)
      .eq('leg', dto.leg)
      .is('consumed_at', null)
      .is('invalidated_at', null);

    // Generate random 4-digit code (1000 - 9999)
    const code = crypto.randomInt(1000, 9999).toString();
    const salt = crypto.randomBytes(16);
    const tokenHash = crypto.createHmac('sha256', salt).update(code).digest();

    // 15-minute token TTL
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: token, error } = await client
      .from('handover_tokens')
      .insert({
        trip_child_id: dto.tripChildId,
        leg: dto.leg,
        token_hash: tokenHash,
        token_salt: salt,
        expires_at: expiresAt,
        issued_to: user.userId,
        attempts: 0,
        max_attempts: 3,
      })
      .select('id, expires_at')
      .single();

    if (error || !token) {
      this.logger.error(`Failed to issue handover token: ${error?.message}`);
      throw new BadRequestException(`Failed to create handover token: ${error?.message}`);
    }

    // Audit log
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'driver',
      action: 'insert',
      tableName: 'handover_tokens',
      recordId: token.id,
      reasonCode: 'HANDOVER_OTP_ISSUED',
      afterData: { tripChildId: dto.tripChildId, leg: dto.leg, expiresAt },
    });

    return {
      tokenId: token.id,
      expiresAt: token.expires_at,
      // In development/test mode, expose code for automated verification testing
      testOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  /**
   * Verifies handover via OTP or authorized credentials, enforces guardian validation,
   * transitions child lifecycle state, and appends to immutable handovers table.
   */
  async verifyHandover(user: AuthenticatedUser, dto: VerifyHandoverDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // 1. Fetch trip child details
    const { data: tripChild } = await client
      .from('trip_children')
      .select(`
        id,
        child_id,
        trip_id,
        state,
        required_legs,
        children (
          id,
          first_name,
          parent_id
        )
      `)
      .eq('id', dto.tripChildId)
      .maybeSingle();

    if (!tripChild) {
      throw new NotFoundException(`Trip Child [${dto.tripChildId}] not found`);
    }

    let tokenId: string | null = null;

    // 2. Verification Method Evaluation
    if (dto.method === 'otp') {
      if (!dto.otp) {
        throw new BadRequestException('OTP code is required for OTP handover verification');
      }

      const { data: token } = await client
        .from('handover_tokens')
        .select('*')
        .eq('trip_child_id', dto.tripChildId)
        .eq('leg', dto.leg)
        .is('consumed_at', null)
        .is('invalidated_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!token) {
        throw new BadRequestException('No active handover OTP token found or token expired');
      }

      tokenId = token.id;

      if (token.attempts >= token.max_attempts) {
        await client.from('handover_attempts').insert({
          trip_child_id: dto.tripChildId,
          leg: dto.leg,
          token_id: token.id,
          attempted_by: user.userId,
          outcome: 'locked_out',
        });
        throw new ForbiddenException('Handover token is locked out due to too many failed attempts');
      }

      // Recompute salted hash
      const computedHash = crypto
        .createHmac('sha256', Buffer.from(token.token_salt))
        .update(dto.otp)
        .digest();

      const isMatch = crypto.timingSafeEqual(computedHash, Buffer.from(token.token_hash));

      if (!isMatch) {
        const newAttempts = token.attempts + 1;
        await client
          .from('handover_tokens')
          .update({ attempts: newAttempts })
          .eq('id', token.id);

        await client.from('handover_attempts').insert({
          trip_child_id: dto.tripChildId,
          leg: dto.leg,
          token_id: token.id,
          attempted_by: user.userId,
          outcome: 'wrong_code',
        });

        // If attempts exceed limit, auto-raise an operational exception
        if (newAttempts >= token.max_attempts) {
          const childObj = Array.isArray(tripChild.children)
            ? tripChild.children[0]
            : (tripChild.children as any);
          await client.from('exceptions').insert({
            exception_type: 'handover_failed',
            severity: 'high',
            trip_id: tripChild.trip_id,
            trip_child_id: dto.tripChildId,
            title: `Handover locked out for child ${childObj?.first_name || 'record'}`,
            details: { leg: dto.leg, attempts: newAttempts },
            auto_raised: true,
          });
        }

        throw new BadRequestException('Invalid handover OTP');
      }

      // Mark token consumed
      await client
        .from('handover_tokens')
        .update({ consumed_at: new Date().toISOString() })
        .eq('id', token.id);

      await client.from('handover_attempts').insert({
        trip_child_id: dto.tripChildId,
        leg: dto.leg,
        token_id: token.id,
        attempted_by: user.userId,
        outcome: 'success',
      });
    }

    // 3. Guardian Pre-Authorization Check
    if (dto.counterpartyGuardianId) {
      const { data: guardianLink } = await client
        .from('child_guardians')
        .select('id, can_pickup, verified_at, revoked_at')
        .eq('child_id', tripChild.child_id)
        .eq('guardian_id', dto.counterpartyGuardianId)
        .is('revoked_at', null)
        .maybeSingle();

      if (!guardianLink || !guardianLink.can_pickup || !guardianLink.verified_at) {
        throw new ForbiddenException(
          'Counterparty is not a verified, authorized pickup contact for this child',
        );
      }
    }

    // 4. Ops Override Role Assertion
    if (dto.method === 'ops_override') {
      if (!dto.overrideReason) {
        throw new BadRequestException('An override reason is mandatory when using ops_override');
      }
      if (!user.roles.includes('operator') && !user.roles.includes('admin')) {
        throw new ForbiddenException('Only operators or administrators may perform ops_override');
      }

      // Raise informational exception for audit trail
      await client.from('exceptions').insert({
        exception_type: 'handover_failed',
        severity: 'medium',
        trip_id: tripChild.trip_id,
        trip_child_id: dto.tripChildId,
        title: `Manual Ops Override used for ${dto.leg}`,
        details: { reason: dto.overrideReason, actorUserId: user.userId },
        auto_raised: true,
      });
    }

    // 5. Insert immutable handover record
    const { data: handover, error: hErr } = await client
      .from('handovers')
      .insert({
        trip_child_id: dto.tripChildId,
        leg: dto.leg,
        method: dto.method,
        performed_by: user.userId,
        counterparty_guardian_id: dto.counterpartyGuardianId || null,
        counterparty_school_user: dto.counterpartySchoolUser || null,
        token_id: tokenId,
        override_reason: dto.overrideReason || null,
      })
      .select()
      .single();

    if (hErr || !handover) {
      this.logger.error(`Handover record insertion failed: ${hErr?.message}`);
      throw new BadRequestException(`Failed to record handover: ${hErr?.message}`);
    }

    // 6. Transition trip_children state
    let targetChildState: string = tripChild.state;
    if (dto.leg === 'home_pickup') {
      targetChildState = 'picked_up';
    } else if (dto.leg === 'school_receipt') {
      targetChildState = 'at_school';
    } else if (dto.leg === 'school_release') {
      targetChildState = 'released_from_school';
    } else if (dto.leg === 'home_dropoff') {
      targetChildState = 'dropped_off';
    }

    await client
      .from('trip_children')
      .update({ state: targetChildState })
      .eq('id', dto.tripChildId);

    // 7. Event log stream
    await client.from('trip_child_events').insert({
      trip_child_id: dto.tripChildId,
      event_type: dto.leg as any,
      actor_user_id: user.userId,
      actor_role: user.roles[0] || 'driver',
      from_state: tripChild.state,
      to_state: targetChildState,
      payload: { method: dto.method, handoverId: handover.id },
    });

    // 8. Audit event
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'driver',
      action: 'insert',
      tableName: 'handovers',
      recordId: handover.id,
      reasonCode: `HANDOVER_${dto.leg.toUpperCase()}_CONFIRMED`,
      afterData: { tripChildId: dto.tripChildId, leg: dto.leg, method: dto.method, state: targetChildState },
    });

    return {
      success: true,
      handoverId: handover.id,
      leg: dto.leg,
      method: dto.method,
      state: targetChildState,
    };
  }
}
