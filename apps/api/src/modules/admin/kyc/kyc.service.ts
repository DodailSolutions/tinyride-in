import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuditService } from '../../audit/audit.service';
import { KycDecisionDto } from './dto/kyc-review.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Returns list of drivers waiting for KYC verification
   */
  async getPendingDriverQueue() {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: drivers } = await client
      .from('drivers')
      .select('*, profiles(phone_e164, display_name), documents(*)')
      .eq('state', 'pending_verification')
      .order('created_at', { ascending: true });

    return drivers || [];
  }

  /**
   * Returns list of vehicles waiting for KYC verification
   */
  async getPendingVehicleQueue() {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: vehicles } = await client
      .from('vehicles')
      .select('*, vehicle_owners(legal_name, user_id), documents(*)')
      .eq('state', 'pending_verification')
      .order('created_at', { ascending: true });

    return vehicles || [];
  }

  /**
   * Returns list of routes waiting for review
   */
  async getPendingRouteQueue() {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: routes } = await client
      .from('routes')
      .select('*, schools(name), route_stops(*), route_schedules(*)')
      .eq('state', 'pending_review')
      .order('created_at', { ascending: true });

    return routes || [];
  }

  /**
   * Submits a formal human review decision for a driver, vehicle, route, or document.
   * STRICT SAFETY GATE: AI models are never allowed to approve human verification decisions.
   */
  async submitDecision(reviewerId: string, dto: KycDecisionDto) {
    const client = this.supabaseService.getServiceRoleClient();
    const now = new Date().toISOString();

    // 1. Prepare review record mapping
    const reviewData: Record<string, unknown> = {
      subject_type: dto.subjectType,
      decision: dto.decision,
      reason_code: dto.reasonCode,
      notes: dto.notes || null,
      reviewer_id: reviewerId,
    };

    let targetTable = '';
    let newState = '';
    const updatePayload: Record<string, unknown> = {};

    switch (dto.subjectType) {
      case 'driver': {
        targetTable = 'drivers';
        reviewData['driver_id'] = dto.subjectId;

        if (dto.decision === 'approved') {
          newState = 'approved';
          updatePayload['state'] = 'approved';
          updatePayload['approved_at'] = now;
        } else if (dto.decision === 'rejected') {
          newState = 'rejected';
          updatePayload['state'] = 'rejected';
        } else {
          newState = 'needs_resubmission';
          updatePayload['state'] = 'needs_resubmission';
        }
        break;
      }
      case 'vehicle': {
        targetTable = 'vehicles';
        reviewData['vehicle_id'] = dto.subjectId;

        if (dto.decision === 'approved') {
          newState = 'approved';
          updatePayload['state'] = 'approved';
          updatePayload['approved_at'] = now;
        } else if (dto.decision === 'rejected') {
          newState = 'suspended';
          updatePayload['state'] = 'suspended';
        } else {
          newState = 'needs_resubmission';
          updatePayload['state'] = 'needs_resubmission';
        }
        break;
      }
      case 'route': {
        targetTable = 'routes';
        reviewData['route_id'] = dto.subjectId;

        if (dto.decision === 'approved') {
          newState = 'approved';
          updatePayload['state'] = 'approved';
          updatePayload['approved_at'] = now;
          updatePayload['approved_by'] = reviewerId;
        } else if (dto.decision === 'rejected') {
          newState = 'needs_changes';
          updatePayload['state'] = 'needs_changes';
        } else {
          newState = 'needs_changes';
          updatePayload['state'] = 'needs_changes';
        }
        break;
      }
      case 'document': {
        targetTable = 'documents';
        reviewData['document_id'] = dto.subjectId;
        updatePayload['verification_status'] = dto.decision === 'approved' ? 'verified' : 'rejected';
        break;
      }
      default:
        throw new BadRequestException(`Unsupported subject type: ${dto.subjectType}`);
    }

    // 2. Verify entity exists
    const { data: entity } = await client
      .from(targetTable)
      .select('id, state')
      .eq('id', dto.subjectId)
      .maybeSingle();

    if (!entity) {
      throw new NotFoundException(`Target [${dto.subjectType}:${dto.subjectId}] not found in ${targetTable}`);
    }

    // 3. Update target entity state
    const { error: updateErr } = await client
      .from(targetTable)
      .update(updatePayload)
      .eq('id', dto.subjectId);

    if (updateErr) {
      this.logger.error(`Failed to update ${targetTable} ${dto.subjectId}: ${updateErr.message}`);
      throw new Error(`Failed to update entity status: ${updateErr.message}`);
    }

    // 4. Insert verification review row
    const { data: review, error: reviewErr } = await client
      .from('verification_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (reviewErr || !review) {
      throw new Error(`Failed to insert verification review: ${reviewErr?.message}`);
    }

    // 5. Audit administrative decision
    await this.auditService.record({
      actorUserId: reviewerId,
      actorRole: 'kyc_reviewer',
      action: 'admin_override',
      tableName: targetTable,
      recordId: dto.subjectId,
      reasonCode: dto.reasonCode,
      afterData: { state: newState || updatePayload['verification_status'], decision: dto.decision },
    });

    this.logger.log(`KYC review completed for [${dto.subjectType}:${dto.subjectId}] -> Decision: ${dto.decision}`);
    return {
      review,
      updatedEntityId: dto.subjectId,
      newState: newState || updatePayload['verification_status'],
    };
  }
}
