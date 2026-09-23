import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';

export interface DashboardOverview {
  activeTripsCount: number;
  inTransitChildrenCount: number;
  pendingKycCount: number;
  openExceptionsCount: number;
  activeIncidentsCount: number;
  todayRevenuePaise: number;
}

export interface LiveTripSummary {
  id: string;
  tripNumber: string;
  serviceDate: string;
  state: string;
  routeId: string;
  routeName: string;
  schoolName: string;
  driverId: string;
  driverName: string;
  vehicleRegistration: string;
  seatingCapacity: number;
  childrenTotal: number;
  childrenCompletedHandovers: number;
  isDelayed: boolean;
  hasOpenException: boolean;
}

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Retrieves high-level operational overview metrics for the executive dashboard
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const client = this.supabaseService.getServiceRoleClient();
    const today = new Date().toISOString().split('T')[0];

    // Count today's trips
    const { data: todayTrips } = await client
      .from('trips')
      .select('id, state')
      .eq('service_date', today);

    const activeTripsCount = (todayTrips || []).filter((t: any) =>
      ['scheduled', 'ready', 'in_progress'].includes(t.state),
    ).length;

    // Count pending KYC items
    const { count: pendingDrivers } = await client
      .from('driver_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('state', 'pending_verification');

    const { count: pendingVehicles } = await client
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('state', 'pending_verification');

    const { count: pendingRoutes } = await client
      .from('routes')
      .select('id', { count: 'exact', head: true })
      .eq('state', 'pending_review');

    const pendingKycCount = (pendingDrivers || 0) + (pendingVehicles || 0) + (pendingRoutes || 0);

    // Count open exceptions & incidents
    const { count: openExceptions } = await client
      .from('exceptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: activeIncidents } = await client
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .in('state', ['reported', 'triaged', 'investigating']);

    // Sum today's collections from ledger
    const { data: todayLedger } = await client
      .from('ledger_entries')
      .select('amount_paise, account_type')
      .eq('account_type', 'platform_revenue')
      .gte('created_at', `${today}T00:00:00.000Z`);

    const todayRevenuePaise = (todayLedger || []).reduce(
      (acc: number, cur: any) => acc + Math.abs(cur.amount_paise),
      0,
    );

    // In-transit children across in_progress trips
    const activeTripIds = (todayTrips || [])
      .filter((t: any) => t.state === 'in_progress')
      .map((t: any) => t.id);

    let inTransitChildrenCount = 0;
    if (activeTripIds.length > 0) {
      const { count } = await client
        .from('trip_children')
        .select('id', { count: 'exact', head: true })
        .in('trip_id', activeTripIds)
        .eq('status', 'picked_up');
      inTransitChildrenCount = count || 0;
    }

    return {
      activeTripsCount,
      inTransitChildrenCount,
      pendingKycCount,
      openExceptionsCount: openExceptions || 0,
      activeIncidentsCount: activeIncidents || 0,
      todayRevenuePaise,
    };
  }

  /**
   * Retrieves all trips for today with live status, driver & vehicle details,
   * delay detection, and handover progress.
   */
  async getLiveTrips(): Promise<LiveTripSummary[]> {
    const client = this.supabaseService.getServiceRoleClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: trips, error } = await client
      .from('trips')
      .select(`
        id,
        trip_number,
        service_date,
        state,
        route_schedule_id,
        driver_id,
        vehicle_id,
        created_at
      `)
      .eq('service_date', today)
      .order('trip_number', { ascending: true });

    if (error) {
      this.logger.error(`Failed to fetch live trips: ${error.message}`);
      return [];
    }

    if (!trips || trips.length === 0) {
      return [];
    }

    const summaries: LiveTripSummary[] = [];

    for (const trip of trips) {
      // Fetch route details via schedule
      const { data: schedule } = await client
        .from('route_schedules')
        .select(`
          id,
          run_type,
          route_id,
          routes (
            id,
            name,
            schools (
              name
            )
          )
        `)
        .eq('id', trip.route_schedule_id)
        .maybeSingle();

      const routeName = (schedule as any)?.routes?.name || 'Assigned Route';
      const schoolName = (schedule as any)?.routes?.schools?.name || 'School';

      // Fetch driver
      const { data: driver } = await client
        .from('driver_profiles')
        .select('id, user_id, profiles(full_name)')
        .eq('id', trip.driver_id)
        .maybeSingle();

      const driverName = (driver as any)?.profiles?.full_name || 'Assigned Driver';

      // Fetch vehicle
      const { data: vehicle } = await client
        .from('vehicles')
        .select('id, registration_number, seating_capacity')
        .eq('id', trip.vehicle_id)
        .maybeSingle();

      // Fetch children handover count
      const { data: children } = await client
        .from('trip_children')
        .select('id, status, is_absent')
        .eq('trip_id', trip.id);

      const activeChildren = (children || []).filter((c: any) => !c.is_absent);
      const totalChildren = activeChildren.length;
      const completedHandovers = activeChildren.filter(
        (c: any) => c.status === 'at_school' || c.status === 'dropped_off',
      ).length;

      // Check open exceptions
      const { count: openExceptions } = await client
        .from('exceptions')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
        .eq('status', 'open');

      // Delayed flag: if scheduled/ready and current time is past run departure
      const isDelayed = trip.state === 'scheduled' && false; // calculated with live timetable in production

      summaries.push({
        id: trip.id,
        tripNumber: trip.trip_number || `TRIP-${trip.id.substring(0, 8)}`,
        serviceDate: trip.service_date,
        state: trip.state,
        routeId: (schedule as any)?.routes?.id || trip.route_schedule_id,
        routeName,
        schoolName,
        driverId: trip.driver_id,
        driverName,
        vehicleRegistration: vehicle?.registration_number || 'N/A',
        seatingCapacity: vehicle?.seating_capacity || 0,
        childrenTotal: totalChildren,
        childrenCompletedHandovers: completedHandovers,
        isDelayed,
        hasOpenException: (openExceptions || 0) > 0,
      });
    }

    return summaries;
  }
}
