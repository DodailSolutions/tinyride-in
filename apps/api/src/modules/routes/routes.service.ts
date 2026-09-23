import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AssignScheduleDto, ProposeRouteDto } from './dto/routes.dto';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Proposes a new school transport route with stops, schedules, and price tiers.
   */
  async proposeRoute(userId: string, dto: ProposeRouteDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // 1. Verify school exists
    const { data: school } = await client
      .from('schools')
      .select('id, name')
      .eq('id', dto.schoolId)
      .maybeSingle();

    if (!school) {
      throw new NotFoundException(`School with ID [${dto.schoolId}] not found`);
    }

    // 2. Insert Route in 'pending_review'
    const { data: route, error: routeErr } = await client
      .from('routes')
      .insert({
        city_id: dto.cityId,
        school_id: dto.schoolId,
        zone_id: dto.zoneId || null,
        name: dto.name,
        proposed_by: userId,
        state: 'pending_review',
        max_detour_minutes: dto.maxDetourMinutes,
      })
      .select()
      .single();

    if (routeErr || !route) {
      throw new Error(`Failed to propose route: ${routeErr?.message}`);
    }

    // 3. Insert Route Stops
    const stopIdMap: Record<number, string> = {};
    for (const stop of dto.stops) {
      const geoWkt = `SRID=4326;POINT(${stop.longitude} ${stop.latitude})`;
      const { data: createdStop, error: stopErr } = await client
        .from('route_stops')
        .insert({
          route_id: route.id,
          stop_type: stop.stopType,
          name: stop.name,
          address: stop.address,
          geo: geoWkt,
          school_id: stop.stopType === 'school' ? dto.schoolId : null,
        })
        .select('id')
        .single();

      if (stopErr || !createdStop) {
        throw new Error(`Failed to insert route stop: ${stopErr?.message}`);
      }
      stopIdMap[stop.sequenceNo] = createdStop.id;
    }

    // 4. Insert Schedules, Schedule Stops & Pricing
    for (const sched of dto.schedules) {
      const { data: createdSched, error: schedErr } = await client
        .from('route_schedules')
        .insert({
          route_id: route.id,
          name: sched.name,
          direction: sched.direction,
          departure_time: sched.departureTime,
          arrival_time: sched.arrivalTime || null,
          seats_offered: sched.seatsOffered,
        })
        .select('id')
        .single();

      if (schedErr || !createdSched) {
        throw new Error(`Failed to create schedule: ${schedErr?.message}`);
      }

      // Link stops to schedule in sequence
      const schedStopRows = dto.stops.map((s) => ({
        schedule_id: createdSched.id,
        route_id: route.id,
        stop_id: stopIdMap[s.sequenceNo],
        sequence_no: s.sequenceNo,
      }));

      await client.from('route_schedule_stops').insert(schedStopRows);

      // Insert Pricing (paise)
      await client.from('route_prices').insert({
        schedule_id: createdSched.id,
        amount_minor: sched.amountMinor,
        currency: 'INR',
        billing_period: 'monthly',
      });
    }

    await this.auditService.record({
      actorUserId: userId,
      actorRole: 'operator',
      action: 'insert',
      tableName: 'routes',
      recordId: route.id,
      reasonCode: 'ROUTE_PROPOSED',
      afterData: { name: route.name, school_id: route.school_id, state: 'pending_review' },
    });

    this.logger.log(`Route [${route.id}] proposed for review`);
    return this.getRouteById(route.id);
  }

  /**
   * Retrieves full route graph with stops, schedules, prices, and assignments.
   */
  async getRouteById(routeId: string) {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: route, error } = await client
      .from('routes')
      .select(`
        *,
        schools(id, name, address),
        route_stops(*),
        route_schedules(
          *,
          route_prices(*),
          route_schedule_stops(*),
          route_assignments(*, drivers(license_number), vehicles(registration_number, usable_capacity))
        )
      `)
      .eq('id', routeId)
      .maybeSingle();

    if (error || !route) {
      throw new NotFoundException(`Route with ID [${routeId}] not found`);
    }

    return route;
  }

  /**
   * Discovers and lists routes, filtering by school or status.
   */
  async listRoutes(query: { schoolId?: string; cityId?: string; state?: string }) {
    const client = this.supabaseService.getServiceRoleClient();

    let q = client
      .from('routes')
      .select('*, schools(id, name), route_schedules(*, route_prices(*))');

    if (query.schoolId) {
      q = q.eq('school_id', query.schoolId);
    }
    if (query.cityId) {
      q = q.eq('city_id', query.cityId);
    }
    if (query.state) {
      q = q.eq('state', query.state);
    }

    const { data: routes } = await q;
    return routes || [];
  }

  /**
   * Assigns an approved driver and vehicle to a route schedule.
   * STRICT SAFETY INVARIANTS:
   * 1. Driver must be in 'approved' state.
   * 2. Vehicle must be in 'approved' state.
   * 3. Driver must be authorized on this vehicle (active driver_vehicle_assignment).
   * 4. seats_offered cannot exceed vehicle usable_capacity.
   */
  async assignSchedule(actorUserId: string, dto: AssignScheduleDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // 1. Validate Schedule
    const { data: sched } = await client
      .from('route_schedules')
      .select('id, seats_offered')
      .eq('id', dto.scheduleId)
      .maybeSingle();

    if (!sched) {
      throw new NotFoundException(`Schedule [${dto.scheduleId}] not found`);
    }

    // 2. Validate Driver is Approved
    const { data: driver } = await client
      .from('drivers')
      .select('id, state')
      .eq('id', dto.driverId)
      .maybeSingle();

    if (!driver || driver.state !== 'approved') {
      throw new BadRequestException(
        `Driver [${dto.driverId}] is in state '${driver?.state || 'missing'}'. Only 'approved' drivers may be assigned to routes.`,
      );
    }

    // 3. Validate Vehicle is Approved
    const { data: vehicle } = await client
      .from('vehicles')
      .select('id, state, usable_capacity')
      .eq('id', dto.vehicleId)
      .maybeSingle();

    if (!vehicle || vehicle.state !== 'approved') {
      throw new BadRequestException(
        `Vehicle [${dto.vehicleId}] is in state '${vehicle?.state || 'missing'}'. Only 'approved' vehicles may be assigned to routes.`,
      );
    }

    // 4. Validate Capacity Limit
    if (sched.seats_offered > vehicle.usable_capacity) {
      throw new BadRequestException(
        `Schedule seats offered (${sched.seats_offered}) exceeds vehicle usable capacity (${vehicle.usable_capacity})`,
      );
    }

    // 5. Validate Driver-Vehicle Owner Authorization
    const { data: dva } = await client
      .from('driver_vehicle_assignments')
      .select('id')
      .eq('driver_id', dto.driverId)
      .eq('vehicle_id', dto.vehicleId)
      .is('revoked_at', null)
      .maybeSingle();

    if (!dva) {
      throw new BadRequestException(
        'Driver is not authorized by the owner to operate this vehicle (missing driver_vehicle_assignment)',
      );
    }

    // 6. Insert Route Assignment
    const { data: assignment, error: assignErr } = await client
      .from('route_assignments')
      .insert({
        schedule_id: dto.scheduleId,
        driver_id: dto.driverId,
        vehicle_id: dto.vehicleId,
        assignment_type: dto.assignmentType || 'primary',
      })
      .select()
      .single();

    if (assignErr || !assignment) {
      throw new Error(`Failed to assign schedule: ${assignErr?.message}`);
    }

    await this.auditService.record({
      actorUserId,
      actorRole: 'operator',
      action: 'insert',
      tableName: 'route_assignments',
      recordId: assignment.id,
      reasonCode: 'DRIVER_VEHICLE_ASSIGNED_TO_SCHEDULE',
      afterData: {
        schedule_id: dto.scheduleId,
        driver_id: dto.driverId,
        vehicle_id: dto.vehicleId,
      },
    });

    return assignment;
  }
}
