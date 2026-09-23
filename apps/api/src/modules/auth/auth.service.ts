import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { AuthenticatedUser, PRIVILEGED_ROLES, RoleCode } from '@tinyride/shared-types';

export interface UserContext {
  id: string;
  phoneE164: string;
  displayName: string | null;
  email: string | null;
  state: string;
  roles: RoleCode[];
  isPrivileged: boolean;
  parentId?: string | null;
  driverId?: string | null;
  ownerId?: string | null;
  schoolId?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Request an SMS OTP for a mobile phone number via Supabase Auth
   */
  async sendOtp(dto: SendOtpDto): Promise<{ message: string; phoneE164: string }> {
    const client = this.supabaseService.getAnonClient();

    const { error } = await client.auth.signInWithOtp({
      phone: dto.phoneE164,
    });

    if (error) {
      this.logger.error(`Supabase signInWithOtp failed for ${dto.phoneE164}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    this.logger.log(`OTP dispatched to ${dto.phoneE164}`);
    return {
      message: 'OTP sent successfully to your mobile number',
      phoneE164: dto.phoneE164,
    };
  }

  /**
   * Verifies the SMS OTP and returns the authenticated session
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
  }> {
    const anonClient = this.supabaseService.getAnonClient();
    const serviceClient = this.supabaseService.getServiceRoleClient();

    const { data, error } = await anonClient.auth.verifyOtp({
      phone: dto.phoneE164,
      token: dto.token,
      type: 'sms',
    });

    if (error || !data.user || !data.session) {
      this.logger.warn(`OTP verification failed for ${dto.phoneE164}: ${error?.message}`);
      throw new UnauthorizedException(error?.message || 'Invalid or expired OTP token');
    }

    const userId = data.user.id;

    // Ensure profile exists in public.profiles
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id, state, suspended_reason, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      // First-time login: create active profile and default 'parent' role
      const { error: profileError } = await serviceClient.from('profiles').insert({
        id: userId,
        phone_e164: dto.phoneE164,
        state: 'active',
      });

      if (profileError) {
        this.logger.error(`Failed to create initial profile for ${userId}: ${profileError.message}`);
      }

      // Assign default parent role
      const { data: parentRole } = await serviceClient
        .from('roles')
        .select('id')
        .eq('code', 'parent')
        .maybeSingle();

      if (parentRole) {
        await serviceClient.from('user_roles').insert({
          user_id: userId,
          role_id: parentRole.id,
        });

        // Also create a linked parent row
        await serviceClient.from('parents').insert({
          user_id: userId,
        });
      }
    } else if (existingProfile.state === 'suspended') {
      throw new ForbiddenException(
        `Account is suspended: ${existingProfile.suspended_reason || 'Please contact support'}`,
      );
    }

    // Resolve roles
    const authUser = await this.resolveUserFromId(userId, dto.phoneE164, data.user.email);

    // Record login audit event
    await this.auditService.record({
      actorUserId: userId,
      actorRole: authUser.roles[0] || 'parent',
      action: 'login',
      tableName: 'profiles',
      recordId: userId,
    });

    return {
      user: authUser,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  /**
   * Resolves an AuthenticatedUser by verifying a Supabase Bearer JWT token
   */
  async validateToken(token: string): Promise<AuthenticatedUser> {
    const client = this.supabaseService.getAnonClient();

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid, revoked, or expired authentication token');
    }

    const userId = data.user.id;
    const phone = data.user.phone || '';
    const email = data.user.email || null;

    return this.resolveUserFromId(userId, phone, email);
  }

  /**
   * Resolves the full user context including database profile and active roles
   */
  async resolveUserFromId(
    userId: string,
    phoneE164?: string,
    email?: string | null,
  ): Promise<AuthenticatedUser> {
    const client = this.supabaseService.getServiceRoleClient();

    // Query profile
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .select('id, phone_e164, email, state, suspended_reason')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      this.logger.error(`Error querying profile for ${userId}: ${profileErr.message}`);
    }

    if (profile && profile.state === 'suspended') {
      throw new ForbiddenException(
        `Account is suspended: ${profile.suspended_reason || 'Please contact support'}`,
      );
    }

    // Query active roles
    const { data: roleRecords, error: roleErr } = await client
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (roleErr) {
      this.logger.error(`Error querying user_roles for ${userId}: ${roleErr.message}`);
    }

    const roles: RoleCode[] = [];
    if (roleRecords && Array.isArray(roleRecords)) {
      for (const rec of roleRecords) {
        // roles can be a single object from foreign table join
        const roleData = rec.roles as unknown as { code: RoleCode } | { code: RoleCode }[];
        if (roleData) {
          if (Array.isArray(roleData)) {
            roleData.forEach((r) => r.code && roles.push(r.code));
          } else if (roleData.code) {
            roles.push(roleData.code);
          }
        }
      }
    }

    // If no roles returned, default to parent
    if (roles.length === 0) {
      roles.push('parent');
    }

    const isPrivileged = roles.some((r) => PRIVILEGED_ROLES.includes(r));

    return {
      userId,
      phoneE164: profile?.phone_e164 || phoneE164 || '',
      email: profile?.email || email || null,
      roles,
      isPrivileged,
    };
  }

  /**
   * Returns rich tenant context for the authenticated caller
   */
  async getMe(user: AuthenticatedUser): Promise<UserContext> {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: profile } = await client
      .from('profiles')
      .select('id, phone_e164, display_name, email, state')
      .eq('id', user.userId)
      .maybeSingle();

    // Query entity links in parallel
    const [parentRes, driverRes, ownerRes, schoolRes] = await Promise.all([
      client.from('parents').select('id').eq('user_id', user.userId).maybeSingle(),
      client.from('drivers').select('id').eq('user_id', user.userId).maybeSingle(),
      client.from('vehicle_owners').select('id').eq('user_id', user.userId).maybeSingle(),
      client.from('school_users').select('school_id').eq('user_id', user.userId).is('revoked_at', null).maybeSingle(),
    ]);

    return {
      id: user.userId,
      phoneE164: profile?.phone_e164 || user.phoneE164,
      displayName: profile?.display_name || null,
      email: profile?.email || user.email || null,
      state: profile?.state || 'active',
      roles: user.roles,
      isPrivileged: user.isPrivileged,
      parentId: parentRes.data?.id || null,
      driverId: driverRes.data?.id || null,
      ownerId: ownerRes.data?.id || null,
      schoolId: schoolRes.data?.school_id || null,
    };
  }
}
