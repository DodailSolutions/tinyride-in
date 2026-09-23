import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '@tinyride/shared-types';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { GenerateTripsDto, ReportAbsenceDto, UpdateTripStateDto } from './dto/trips.dto';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generates daily trips and child manifests for a given date.
   * Matches schedule days_of_week, checks school holidays, and excludes absent children.
   */
  async generateTrips(dto: GenerateTripsDto, actorUserId: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const targetDate = dto.date;

    // Convert date string to ISO Day of Week (1=Monday ... 7=Sunday)
    const d = new Date(targetDate);
    const day = d.getDay(); // 0=Sunday ... 6=Saturday
    const isodow = day === 0 ? 7 : day;

    // 1. Fetch active schedules for approved routes matching DOW
    const { data: schedules, error: sErr } = await client
      .from('route_schedules')
      .select(`
        id,
        route_id,
        direction,
        departure_time,
        days_of_week,
        routes:route_id (
          id,
          school_id,
          state
        )
      `)
      .eq('active', true);

    if (sErr) {
      throw new BadRequestException(`Failed to query route schedules: ${sErr.message}`);
    }

    let tripsCreated = 0;
    let manifestEntriesCreated = 0;

    for (const schedule of schedules || []) {
      const route = Array.isArray(schedule.routes) ? schedule.routes[0] : (schedule.routes as any);

      if (!route || route.state !== 'approved') {
        continue;
      }

      if (schedule.days_of_week && !schedule.days_of_week.includes(isodow)) {
        continue;
      }

      // Check school holiday
      if (route.school_id) {
        const { data: holiday } = await client
          .from('school_calendar_days')
          .select('id')
          .eq('school_id', route.school_id)
          .eq('calendar_date', targetDate)
          .eq('day_type', 'holiday')
          .maybeSingle();

        if (holiday) {
          continue; // Skip trip generation on school holidays
        }
      }

      // Find primary route assignment (driver & vehicle)
      const { data: assignment } = await client
        .from('route_assignments')
        .select('id, driver_id, vehicle_id')
        .eq('schedule_id', schedule.id)
        .eq('assignment_type', 'primary')
        .is('revoked_at', null)
        .maybeSingle();

      if (!assignment || !assignment.driver_id || !assignment.vehicle_id) {
        this.logger.warn(`Schedule ${schedule.id} has no valid primary driver/vehicle assignment`);
        continue;
      }

      // Compute scheduled_start
      const scheduledStart = `${targetDate}T${schedule.departure_time || '07:30:00'}Z`;

      // Insert trip if not existing (unique by schedule_id, trip_date)
      let tripId: string;
      const { data: existingTrip } = await client
        .from('trips')
        .select('id')
        .eq('schedule_id', schedule.id)
        .eq('trip_date', targetDate)
        .maybeSingle();

      if (existingTrip) {
        tripId = existingTrip.id;
      } else {
        const { data: newTrip, error: tErr } = await client
          .from('trips')
          .insert({
            schedule_id: schedule.id,
            route_id: schedule.route_id,
            trip_date: targetDate,
            direction: schedule.direction,
            driver_id: assignment.driver_id,
            vehicle_id: assignment.vehicle_id,
            assignment_id: assignment.id,
            scheduled_start: scheduledStart,
            state: 'scheduled',
          })
          .select('id')
          .single();

        if (tErr || !newTrip) {
          this.logger.error(`Trip creation error: ${tErr?.message}`);
          continue;
        }
        tripId = newTrip.id;
        tripsCreated++;
      }

      // 2. Populate trip_children manifest
      const { data: bookings } = await client
        .from('bookings')
        .select('id, child_id, pickup_stop_id, dropoff_stop_id')
        .eq('schedule_id', schedule.id)
        .in('state', ['confirmed', 'active'])
        .lte('service_start', targetDate);

      for (const booking of bookings || []) {
        // Check if child reported absent for this date
        const { data: absence } = await client
          .from('child_absences')
          .select('id')
          .eq('child_id', booking.child_id)
          .eq('absence_date', targetDate)
          .is('cancelled_at', null)
          .maybeSingle();

        if (absence) {
          continue; // Exclude absent child from the active manifest
        }

        const requiredLegs =
          schedule.direction === 'am'
            ? ['home_pickup', 'school_receipt']
            : ['school_release', 'home_dropoff'];

        const { data: childEntry, error: mErr } = await client
          .from('trip_children')
          .insert({
            trip_id: tripId,
            trip_date: targetDate,
            child_id: booking.child_id,
            booking_id: booking.id,
            pickup_stop_id: booking.pickup_stop_id,
            dropoff_stop_id: booking.dropoff_stop_id,
            required_legs: requiredLegs,
            state: 'pending',
          })
          .select('id')
          .maybeSingle();

        if (!mErr && childEntry) {
          manifestEntriesCreated++;
        }
      }
    }

    // Record audit event
    await this.auditService.record({
      actorUserId,
      actorRole: 'operator',
      action: 'insert',
      tableName: 'trips',
      reasonCode: 'TRIPS_GENERATED_FOR_DATE',
      afterData: { date: targetDate, tripsCreated, manifestEntriesCreated },
    });

    return {
      date: targetDate,
      tripsCreated,
      manifestEntriesCreated,
    };
  }

  /**
   * Retrieves today's execution manifest for the authenticated driver.
   */
  async getDriverManifestToday(driverUserId: string, date?: string) {
    const client = this.supabaseService.getServiceRoleClient();
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Find driver record
    const { data: driver } = await client
      .from('drivers')
      .select('id')
      .eq('user_id', driverUserId)
      .maybeSingle();

    if (!driver) {
      throw new ForbiddenException('User is not registered as a driver');
    }

    // Query driver trips for the day
    const { data: trips, error } = await client
      .from('trips')
      .select(`
        id,
        trip_date,
        direction,
        scheduled_start,
        actual_start,
        actual_end,
        state,
        readiness_checked_at,
        routes (
          id,
          name,
          schools (
            id,
            name,
            address
          )
        ),
        vehicles (
          id,
          registration_number,
          make_model,
          seating_capacity
        ),
        trip_children (
          id,
          child_id,
          state,
          required_legs,
          children:child_id (
            id,
            first_name,
            photo_path,
            grade,
            section
          ),
          pickup_stop:pickup_stop_id (
            id,
            name,
            address,
            geo
          ),
          dropoff_stop:dropoff_stop_id (
            id,
            name,
            address,
            geo
          )
        )
      `)
      .eq('driver_id', driver.id)
      .eq('trip_date', targetDate);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return trips || [];
  }

  /**
   * Retrieves manifest and status for a specific trip.
   */
  async getTripManifest(tripId: string, user: AuthenticatedUser) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: trip, error } = await client
      .from('trips')
      .select(`
        *,
        routes (*),
        vehicles (*),
        drivers (*),
        trip_children (
          *,
          children (
            id,
            first_name,
            photo_path,
            grade
          ),
          pickup_stop:pickup_stop_id (*),
          dropoff_stop:dropoff_stop_id (*),
          handovers (*)
        )
      `)
      .eq('id', tripId)
      .maybeSingle();

    if (!trip) {
      throw new NotFoundException(`Trip [${tripId}] not found`);
    }

    return trip;
  }

  /**
   * Updates trip state following the state machine rules and readiness assertions.
   */
  async updateTripState(tripId: string, user: AuthenticatedUser, dto: UpdateTripStateDto) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: trip } = await client
      .from('trips')
      .select('id, state, driver_id, schedule_id')
      .eq('id', tripId)
      .maybeSingle();

    if (!trip) {
      throw new NotFoundException(`Trip [${tripId}] not found`);
    }

    const now = new Date().toISOString();
    const updateData: Record<string, any> = { state: dto.state };

    if (dto.state === 'ready') {
      if (!dto.readinessChecked) {
        throw new BadRequestException('Pre-trip readiness safety checklist must be completed');
      }
      updateData.readiness_checked_at = now;
    } else if (dto.state === 'in_progress') {
      if (trip.state !== 'ready' && trip.state !== 'scheduled') {
        throw new BadRequestException(`Cannot start trip from state: ${trip.state}`);
      }
      updateData.actual_start = now;
    } else if (dto.state === 'completed') {
      if (trip.state !== 'in_progress') {
        throw new BadRequestException(`Cannot complete trip that is not in progress (current: ${trip.state})`);
      }

      // Assert Trip Completable: check all non-absent children have all required legs completed
      const { data: children } = await client
        .from('trip_children')
        .select(`
          id,
          state,
          required_legs,
          handovers (leg)
        `)
        .eq('trip_id', tripId);

      const unresolved = (children || []).filter((tc) => {
        if (tc.state === 'absent' || tc.state === 'no_show') return false;
        const completedLegs = (tc.handovers || []).map((h: any) => h.leg);
        return tc.required_legs.some((leg: string) => !completedLegs.includes(leg));
      });

      if (unresolved.length > 0) {
        throw new BadRequestException(
          `Cannot complete trip: ${unresolved.length} child handover(s) remain unresolved`,
        );
      }

      updateData.actual_end = now;
    } else if (dto.state === 'cancelled') {
      if (!dto.cancelReasonCode) {
        throw new BadRequestException('A reason code is mandatory when cancelling a trip');
      }
      updateData.cancel_reason_code = dto.cancelReasonCode;
    }

    const { data: updated, error } = await client
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single();

    if (error || !updated) {
      throw new BadRequestException(`Failed to transition trip: ${error?.message}`);
    }

    // Append to trip_events
    await client.from('trip_events').insert({
      trip_id: tripId,
      event_type: dto.state === 'in_progress' ? 'started' : (dto.state as any),
      actor_user_id: user.userId,
      payload: { fromState: trip.state, toState: dto.state, reason: dto.cancelReasonCode },
    });

    // Record audit event
    await this.auditService.record({
      actorUserId: user.userId,
      actorRole: user.roles[0] || 'driver',
      action: 'update',
      tableName: 'trips',
      recordId: tripId,
      reasonCode: `TRIP_${dto.state.toUpperCase()}`,
      beforeData: { state: trip.state },
      afterData: { state: dto.state },
    });

    return updated;
  }

  /**
   * Reports a child absence from parents, excluding the child from daily manifests.
   */
  async reportAbsence(parentUserId: string, dto: ReportAbsenceDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // Verify parent owns child
    const { data: parent } = await client
      .from('parents')
      .select('id')
      .eq('user_id', parentUserId)
      .maybeSingle();

    if (!parent) {
      throw new ForbiddenException('User is not registered as a parent');
    }

    const { data: child } = await client
      .from('children')
      .select('id, parent_id')
      .eq('id', dto.childId)
      .maybeSingle();

    if (!child || child.parent_id !== parent.id) {
      throw new ForbiddenException('Data Isolation Violation: Child does not belong to you');
    }

    // Insert absence row
    const { data: absence, error } = await client
      .from('child_absences')
      .insert({
        child_id: dto.childId,
        absence_date: dto.absenceDate,
        direction: dto.direction || null,
        reason: dto.reason || null,
        reported_by: parentUserId,
      })
      .select()
      .single();

    if (error || !absence) {
      throw new BadRequestException(`Failed to record absence: ${error?.message}`);
    }

    // If manifest was already generated, mark child as absent
    await client
      .from('trip_children')
      .update({ state: 'absent' })
      .eq('child_id', dto.childId)
      .eq('trip_date', dto.absenceDate);

    // Audit log
    await this.auditService.record({
      actorUserId: parentUserId,
      actorRole: 'parent',
      action: 'insert',
      tableName: 'child_absences',
      recordId: absence.id,
      reasonCode: 'CHILD_ABSENCE_REPORTED',
      afterData: { childId: dto.childId, date: dto.absenceDate, direction: dto.direction },
    });

    return absence;
  }
}
