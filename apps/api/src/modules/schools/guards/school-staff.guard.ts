import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';

@Injectable()
export class SchoolStaffGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Platform admin has universal oversight
    if (user.roles?.includes('admin')) {
      return true;
    }

    // Must have school_staff role
    if (!user.roles?.includes('school_staff')) {
      throw new ForbiddenException('Access restricted to verified school staff');
    }

    const client = this.supabaseService.getServiceRoleClient();

    // Resolve caller's active school membership
    const { data: membership, error } = await client
      .from('school_users')
      .select('id, school_id, staff_role, revoked_at')
      .eq('user_id', user.userId)
      .is('revoked_at', null)
      .maybeSingle();

    if (error || !membership) {
      throw new ForbiddenException('No active school staff affiliation found for user');
    }

    // Attach verified school context to request
    request.schoolContext = {
      schoolUserId: membership.id,
      schoolId: membership.school_id,
      staffRole: membership.staff_role,
    };

    return true;
  }
}
