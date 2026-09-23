import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import {
  ConfirmSchoolArrivalDto,
  ConfirmSchoolReleaseDto,
  ReportSchoolExceptionDto,
} from './dto/schools.dto';

export interface SchoolDetails {
  id: string;
  name: string;
  address: string;
  contactPhone: string;
  amArriveBy: string;
  pmReleaseAt: string;
  verificationStatus: string;
  staffRole?: string;
}

export interface StudentRosterItem {
  childId: string;
  fullName: string;
  grade: string;
  dateOfBirth: string;
  medicalNotes?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  assignedRoute?: {
    id: string;
    name: string;
    stopName: string;
  };
}

export interface ArrivalTripSummary {
  tripId: string;
  tripNumber: string;
  routeName: string;
  state: string;
  driverName: string;
  driverPhone: string;
  vehicleRegistration: string;
  vehicleType: string;
  students: {
    tripChildId: string;
    childId: string;
    childName: string;
    grade: string;
    status: string; // picked_up, at_school, etc.
    isAbsent: boolean;
    arrivedAt?: string;
  }[];
}

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Resolves the school details for an authenticated school staff member
   */
  async getMySchool(userId: string): Promise<SchoolDetails> {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: member, error: memberErr } = await client
      .from('school_users')
      .select('id, school_id, staff_role, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .maybeSingle();

    if (memberErr || !member) {
      throw new ForbiddenException('User is not an active staff member of any school');
    }

    const { data: school, error: schoolErr } = await client
      .from('schools')
      .select(`
        id,
        name,
        address,
        contact_phone_e164,
        am_arrive_by,
        pm_release_at,
        verification_status
      `)
      .eq('id', member.school_id)
      .single();

    if (schoolErr || !school) {
      throw new NotFoundException('School record not found');
    }

    return {
      id: school.id,
      name: school.name,
      address: school.address || '',
      contactPhone: school.contact_phone_e164 || '',
      amArriveBy: school.am_arrive_by || '08:00:00',
      pmReleaseAt: school.pm_release_at || '15:00:00',
      verificationStatus: school.verification_status,
      staffRole: member.staff_role,
    };
  }

  /**
   * Retrieves the student transport roster for a specific school (strictly isolated)
   */
  async getRoster(schoolId: string): Promise<StudentRosterItem[]> {
    const client = this.supabaseService.getServiceRoleClient();

    const { data: children, error } = await client
      .from('children')
      .select(`
        id,
        first_name,
        last_name,
        grade,
        date_of_birth,
        medical_notes,
        child_guardians (
          id,
          relationship,
          is_emergency_contact,
          can_pickup,
          guardians (
            full_name,
            phone_e164
          )
        ),
        bookings (
          id,
          status,
          route_schedules (
            id,
            routes (
              id,
              name
            )
          )
        )
      `)
      .eq('school_id', schoolId);

    if (error) {
      this.logger.error(`Error querying roster for school ${schoolId}: ${error.message}`);
      return [];
    }

    return (children || []).map((c: any) => {
      const emergency = (c.child_guardians || []).find(
        (g: any) => g.is_emergency_contact,
      ) || (c.child_guardians || [])[0];

      const activeBooking = (c.bookings || []).find((b: any) => b.status === 'confirmed');
      const route = (activeBooking as any)?.route_schedules?.routes;

      return {
        childId: c.id,
        fullName: `${c.first_name} ${c.last_name}`.trim(),
        grade: c.grade || 'N/A',
        dateOfBirth: c.date_of_birth,
        medicalNotes: c.medical_notes,
        emergencyContact: {
          name: emergency?.guardians?.full_name || 'Emergency Contact',
          phone: emergency?.guardians?.phone_e164 || 'N/A',
          relationship: emergency?.relationship || 'guardian',
        },
        assignedRoute: route
          ? {
              id: route.id,
              name: route.name,
              stopName: 'Designated Stop',
            }
          : undefined,
      };
    });
  }

  /**
   * Retrieves today's morning inbound arrivals for the school gate
   */
  async getTodayArrivals(schoolId: string): Promise<ArrivalTripSummary[]> {
    const client = this.supabaseService.getServiceRoleClient();
    const today = new Date().toISOString().split('T')[0];

    // Find routes terminating at this school
    const { data: routes } = await client
      .from('routes')
      .select('id')
      .eq('school_id', schoolId);

    const routeIds = (routes || []).map((r: any) => r.id);
    if (routeIds.length === 0) return [];

    // Find morning schedules
    const { data: schedules } = await client
      .from('route_schedules')
      .select('id, route_id, routes(name)')
      .in('route_id', routeIds)
      .eq('run_type', 'morning');

    const scheduleMap = new Map<string, string>();
    (schedules || []).forEach((s: any) => {
      scheduleMap.set(s.id, s.routes?.name || 'School Route');
    });

    const scheduleIds = Array.from(scheduleMap.keys());
    if (scheduleIds.length === 0) return [];

    // Find today's trips
    const { data: trips } = await client
      .from('trips')
      .select(`
        id,
        trip_number,
        state,
        route_schedule_id,
        driver_profiles (
          id,
          profiles (
            full_name,
            phone_e164
          )
        ),
        vehicles (
          registration_number,
          vehicle_type
        )
      `)
      .eq('service_date', today)
      .in('route_schedule_id', scheduleIds);

    const summaries: ArrivalTripSummary[] = [];

    for (const trip of trips || []) {
      const { data: children } = await client
        .from('trip_children')
        .select(`
          id,
          child_id,
          status,
          is_absent,
          children (
            first_name,
            last_name,
            grade
          ),
          handovers (
            recorded_at,
            leg
          )
        `)
        .eq('trip_id', trip.id);

      const studentList = (children || []).map((c: any) => {
        const receiptHandover = (c.handovers || []).find((h: any) => h.leg === 'school_receipt');
        return {
          tripChildId: c.id,
          childId: c.child_id,
          childName: `${c.children?.first_name || ''} ${c.children?.last_name || ''}`.trim(),
          grade: c.children?.grade || '',
          status: c.status,
          isAbsent: c.is_absent,
          arrivedAt: receiptHandover?.recorded_at,
        };
      });

      summaries.push({
        tripId: trip.id,
        tripNumber: trip.trip_number || `TRIP-${trip.id.substring(0, 8)}`,
        routeName: scheduleMap.get(trip.route_schedule_id) || 'Morning Run',
        state: trip.state,
        driverName: (trip as any).driver_profiles?.profiles?.full_name || 'Assigned Driver',
        driverPhone: (trip as any).driver_profiles?.profiles?.phone_e164 || 'N/A',
        vehicleRegistration: (trip as any).vehicles?.registration_number || 'N/A',
        vehicleType: (trip as any).vehicles?.vehicle_type || 'van',
        students: studentList,
      });
    }

    return summaries;
  }

  /**
   * Confirms school receipt of student (Morning arrival check-in)
   * Invariant: Attributed to staff member counterparty_school_user.
   */
  async confirmArrival(schoolId: string, staffUserId: string, dto: ConfirmSchoolArrivalDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // Verify trip_child belongs to a route for this school
    const { data: tc, error: tcErr } = await client
      .from('trip_children')
      .select(`
        id,
        trip_id,
        child_id,
        status,
        trips (
          id,
          route_schedule_id,
          route_schedules (
            routes (
              school_id
            )
          )
        )
      `)
      .eq('id', dto.tripChildId)
      .single();

    if (tcErr || !tc) {
      throw new NotFoundException('Trip child record not found');
    }

    const tripSchoolId = (tc as any).trips?.route_schedules?.routes?.school_id;
    if (tripSchoolId !== schoolId) {
      throw new ForbiddenException('Cannot confirm arrivals for students outside your school tenant');
    }

    // Insert handover record with school_receipt leg and counterparty staff
    const { data: handover, error: hErr } = await client
      .from('handovers')
      .insert({
        trip_child_id: dto.tripChildId,
        leg: 'school_receipt',
        method: 'school_receipt',
        counterparty_school_user: staffUserId,
        notes: dto.notes || 'Arrived at school gate safely',
      })
      .select()
      .single();

    if (hErr) {
      throw new BadRequestException(`Failed to record arrival handover: ${hErr.message}`);
    }

    // Update trip_children status to at_school
    await client
      .from('trip_children')
      .update({ status: 'at_school' })
      .eq('id', dto.tripChildId);

    // Append to trip_child_events
    await client.from('trip_child_events').insert({
      trip_child_id: dto.tripChildId,
      event_type: 'at_school',
      actor_id: staffUserId,
      metadata: { notes: dto.notes, handover_id: handover.id },
    });

    return {
      status: 'confirmed',
      tripChildId: dto.tripChildId,
      childStatus: 'at_school',
      handoverId: handover.id,
      timestamp: handover.recorded_at,
    };
  }

  /**
   * Retrieves today's afternoon outbound releases for gate clearance
   */
  async getTodayReleases(schoolId: string): Promise<ArrivalTripSummary[]> {
    const client = this.supabaseService.getServiceRoleClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: routes } = await client
      .from('routes')
      .select('id')
      .eq('school_id', schoolId);

    const routeIds = (routes || []).map((r: any) => r.id);
    if (routeIds.length === 0) return [];

    const { data: schedules } = await client
      .from('route_schedules')
      .select('id, route_id, routes(name)')
      .in('route_id', routeIds)
      .eq('run_type', 'afternoon');

    const scheduleMap = new Map<string, string>();
    (schedules || []).forEach((s: any) => {
      scheduleMap.set(s.id, s.routes?.name || 'Afternoon Run');
    });

    const scheduleIds = Array.from(scheduleMap.keys());
    if (scheduleIds.length === 0) return [];

    const { data: trips } = await client
      .from('trips')
      .select(`
        id,
        trip_number,
        state,
        route_schedule_id,
        driver_profiles (
          id,
          license_number,
          profiles (
            full_name,
            phone_e164
          )
        ),
        vehicles (
          registration_number,
          vehicle_type
        )
      `)
      .eq('service_date', today)
      .in('route_schedule_id', scheduleIds);

    const summaries: ArrivalTripSummary[] = [];

    for (const trip of trips || []) {
      const { data: children } = await client
        .from('trip_children')
        .select(`
          id,
          child_id,
          status,
          is_absent,
          children (
            first_name,
            last_name,
            grade
          )
        `)
        .eq('trip_id', trip.id);

      const studentList = (children || []).map((c: any) => ({
        tripChildId: c.id,
        childId: c.child_id,
        childName: `${c.children?.first_name || ''} ${c.children?.last_name || ''}`.trim(),
        grade: c.children?.grade || '',
        status: c.status,
        isAbsent: c.is_absent,
      }));

      summaries.push({
        tripId: trip.id,
        tripNumber: trip.trip_number || `TRIP-${trip.id.substring(0, 8)}`,
        routeName: scheduleMap.get(trip.route_schedule_id) || 'Afternoon Run',
        state: trip.state,
        driverName: (trip as any).driver_profiles?.profiles?.full_name || 'Assigned Driver',
        driverPhone: (trip as any).driver_profiles?.profiles?.phone_e164 || 'N/A',
        vehicleRegistration: (trip as any).vehicles?.registration_number || 'N/A',
        vehicleType: (trip as any).vehicles?.vehicle_type || 'van',
        students: studentList,
      });
    }

    return summaries;
  }

  /**
   * Confirms afternoon gate release to authorized vehicle and driver
   */
  async confirmRelease(schoolId: string, staffUserId: string, dto: ConfirmSchoolReleaseDto) {
    if (!dto.driverVerified || !dto.vehicleVerified) {
      throw new BadRequestException('Gate release requires positive verification of both driver identity and vehicle registration');
    }

    const client = this.supabaseService.getServiceRoleClient();

    const { data: tc, error: tcErr } = await client
      .from('trip_children')
      .select(`
        id,
        trip_id,
        child_id,
        status,
        trips (
          id,
          route_schedule_id,
          route_schedules (
            routes (
              school_id
            )
          )
        )
      `)
      .eq('id', dto.tripChildId)
      .single();

    if (tcErr || !tc) {
      throw new NotFoundException('Trip child record not found');
    }

    const tripSchoolId = (tc as any).trips?.route_schedules?.routes?.school_id;
    if (tripSchoolId !== schoolId) {
      throw new ForbiddenException('Cannot authorize releases for students outside your school tenant');
    }

    const { data: handover, error: hErr } = await client
      .from('handovers')
      .insert({
        trip_child_id: dto.tripChildId,
        leg: 'school_release',
        method: 'school_release',
        counterparty_school_user: staffUserId,
        notes: dto.notes || 'Released from school gate to scheduled driver',
      })
      .select()
      .single();

    if (hErr) {
      throw new BadRequestException(`Failed to record release handover: ${hErr.message}`);
    }

    await client
      .from('trip_children')
      .update({ status: 'released_from_school' })
      .eq('id', dto.tripChildId);

    await client.from('trip_child_events').insert({
      trip_child_id: dto.tripChildId,
      event_type: 'released_from_school',
      actor_id: staffUserId,
      metadata: { notes: dto.notes, handover_id: handover.id },
    });

    return {
      status: 'confirmed',
      tripChildId: dto.tripChildId,
      childStatus: 'released_from_school',
      handoverId: handover.id,
      timestamp: handover.recorded_at,
    };
  }

  /**
   * Reports a school-side gate exception (e.g. absent at gate or unauthorized pickup attempt)
   */
  async reportException(schoolId: string, staffUserId: string, dto: ReportSchoolExceptionDto) {
    const client = this.supabaseService.getServiceRoleClient();

    // Verify child belongs to school
    const { data: child, error: cErr } = await client
      .from('children')
      .select('id, school_id')
      .eq('id', dto.childId)
      .single();

    if (cErr || !child || child.school_id !== schoolId) {
      throw new ForbiddenException('Child does not belong to your school tenant');
    }

    const { data: exception, error } = await client
      .from('exceptions')
      .insert({
        trip_id: dto.tripId,
        child_id: dto.childId,
        exception_type: dto.exceptionType,
        severity: dto.severity || 'high',
        status: 'open',
        notes: `Reported by School Staff: ${dto.notes}`,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to report school exception: ${error.message}`);
    }

    return exception;
  }
}
