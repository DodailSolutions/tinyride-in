import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '@tinyride/shared-types';

@Injectable()
export class ParentOwnershipGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('Unauthenticated user');
    }

    // Admins and staff have operational override capability (audited)
    if (user.roles.includes('admin') || user.roles.includes('operator')) {
      return true;
    }

    const client = this.supabaseService.getServiceRoleClient();

    // Resolve parent profile
    const { data: parent } = await client
      .from('parents')
      .select('id')
      .eq('user_id', user.userId)
      .maybeSingle();

    if (!parent) {
      throw new ForbiddenException('User is not registered as a parent');
    }

    // Attach parentId to request for convenience in downstream controllers
    request.parentId = parent.id;

    // Check childId parameter if present in route params or body
    const childId = request.params?.childId || request.body?.childId;
    if (childId) {
      const { data: child } = await client
        .from('children')
        .select('id, parent_id')
        .eq('id', childId)
        .maybeSingle();

      if (!child) {
        throw new NotFoundException(`Child with ID [${childId}] not found`);
      }

      if (child.parent_id !== parent.id) {
        throw new ForbiddenException(
          'Data Isolation Violation: You are not authorized to access this child record.',
        );
      }
    }

    // Check bookingId parameter if present in route params or body
    const bookingId = request.params?.bookingId || request.body?.bookingId;
    if (bookingId) {
      const { data: booking } = await client
        .from('bookings')
        .select('id, parent_id')
        .eq('id', bookingId)
        .maybeSingle();

      if (!booking) {
        throw new NotFoundException(`Booking with ID [${bookingId}] not found`);
      }

      if (booking.parent_id !== parent.id) {
        throw new ForbiddenException(
          'Data Isolation Violation: You are not authorized to access this booking record.',
        );
      }
    }

    return true;
  }
}
