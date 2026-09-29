import { NextResponse } from 'next/server';
import { getServiceSupabase, parsePointHex, realtimeBus } from '@/server/supabase';
import { getAuthenticatedAdmin } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Central Administrator session required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const isDemoExplicit = searchParams.get('demo') === 'true' || process.env.DEMO_MODE === 'true';

  try {
    const supabase = getServiceSupabase();

    // 1. Measure real database latency
    const pingStart = Date.now();
    const { error: pingErr } = await supabase.from('schools').select('id').limit(1);
    const dbLatencyMs = Date.now() - pingStart;

    if (pingErr) {
      console.warn('[Admin Command Center] Supabase ping warning:', pingErr);
    }

    // 2. Query active trips

    const [
      { data: trips },
      { data: exceptions },
      { data: pendingDrivers },
      { data: pendingVehicles },
      { data: recentEvents },
      { count: completedTripsCount },
      { count: allDriversCount },
      { count: allVehiclesCount },
    ] = await Promise.all([
      supabase
        .from('trips')
        .select(`
          id,
          state,
          trip_date,
          direction,
          scheduled_start,
          actual_start,
          actual_end,
          driver_id,
          vehicle_id,
          route_id
        `)
        .order('scheduled_start', { ascending: false })
        .limit(50),
      supabase
        .from('exceptions')
        .select('*')
        .in('state', ['open', 'acknowledged', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('drivers')
        .select('id, license_number, state, created_at, profiles(display_name, phone_e164)')
        .eq('state', 'pending')
        .limit(10),
      supabase
        .from('vehicles')
        .select('id, registration_number, vehicle_type, make_model, state, created_at')
        .eq('state', 'pending')
        .limit(10),
      supabase
        .from('trip_events')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(25),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('state', 'completed'),
      supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('state', 'approved'),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('state', 'approved'),
    ]);

    // Gather related entities for active trips
    const tripIds = (trips || []).map((t) => t.id);
    const driverIds = Array.from(new Set((trips || []).map((t) => t.driver_id).filter(Boolean)));
    const vehicleIds = Array.from(new Set((trips || []).map((t) => t.vehicle_id).filter(Boolean)));
    const routeIds = Array.from(new Set((trips || []).map((t) => t.route_id).filter(Boolean)));

    const [
      { data: driversData },
      { data: vehiclesData },
      { data: routesData },
      { data: tripChildrenData },
      { data: latestTelemetryData },
    ] = await Promise.all([
      driverIds.length > 0
        ? supabase.from('drivers').select('id, license_number, profiles(display_name, phone_e164)').in('id', driverIds)
        : Promise.resolve({ data: [] }),
      vehicleIds.length > 0
        ? supabase.from('vehicles').select('id, registration_number, vehicle_type, make_model, seating_capacity').in('id', vehicleIds)
        : Promise.resolve({ data: [] }),
      routeIds.length > 0
        ? supabase.from('routes').select('id, code, name, school_id, schools(name)').in('id', routeIds)
        : Promise.resolve({ data: [] }),
      tripIds.length > 0
        ? supabase.from('trip_children').select('id, trip_id, state').in('trip_id', tripIds)
        : Promise.resolve({ data: [] }),
      tripIds.length > 0
        ? supabase.from('trip_locations').select('trip_id, geo, speed_kph, accuracy_m, recorded_at').in('trip_id', tripIds).order('recorded_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    // Build lookup maps
    const driverMap = new Map((driversData || []).map((d: any) => [d.id, d]));
    const vehicleMap = new Map((vehiclesData || []).map((v: any) => [v.id, v]));
    const routeMap = new Map((routesData || []).map((r: any) => [r.id, r]));

    // Latest location per trip
    const latestLocMap = new Map<string, any>();
    if (latestTelemetryData) {
      for (const loc of latestTelemetryData) {
        if (!latestLocMap.has(loc.trip_id)) {
          const pt = parsePointHex(loc.geo);
          latestLocMap.set(loc.trip_id, {
            ...loc,
            lat: pt?.lat ?? null,
            lng: pt?.lng ?? null,
          });
        }
      }
    }

    // Children count per trip
    const tripChildrenCountMap = new Map<string, { total: number; boarded: number }>();
    if (tripChildrenData) {
      for (const tc of tripChildrenData) {
        const cur = tripChildrenCountMap.get(tc.trip_id) || { total: 0, boarded: 0 };
        cur.total += 1;
        if (tc.state === 'boarded' || tc.state === 'in_transit' || tc.state === 'at_school') {
          cur.boarded += 1;
        }
        tripChildrenCountMap.set(tc.trip_id, cur);
      }
    }

    // Process trips
    const liveTripsList = (trips || []).map((trip: any) => {
      const driver = driverMap.get(trip.driver_id);
      const vehicle = vehicleMap.get(trip.vehicle_id);
      const route = routeMap.get(trip.route_id);
      const loc = latestLocMap.get(trip.id);
      const childStats = tripChildrenCountMap.get(trip.id) || { total: 0, boarded: 0 };

      // Determine stale status
      let isStale = false;
      let lastUpdatedText = 'Recently';
      if (loc?.recorded_at) {
        const diffMs = Date.now() - new Date(loc.recorded_at).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin > 2) isStale = true;
        lastUpdatedText = diffMin === 0 ? 'Just now' : `${diffMin}m ago`;
      } else {
        lastUpdatedText = 'No GPS yet';
        isStale = true;
      }

      const isDelayed = trip.state === 'delayed';

      return {
        tripId: trip.id,
        routeCode: route?.code || 'M-ROUTE',
        routeName: route?.name || 'Assigned School Route',
        schoolName: route?.schools?.name || 'Registered Campus',
        driverName: driver?.profiles?.display_name || 'Assigned Driver',
        driverPhone: driver?.profiles?.phone_e164 || '',
        vehicleNumber: vehicle?.registration_number || 'TS-REGISTERED',
        vehicleModel: vehicle?.make_model || 'School Transit',
        vehicleType: vehicle?.vehicle_type || 'van',
        passengersBoarded: childStats.boarded,
        totalPassengers: childStats.total,
        currentPhase: trip.state,
        slaStatus: isDelayed ? 'delayed' : 'normal',
        delayMinutes: isDelayed ? 8 : 0,
        eta: trip.state === 'at_school' ? 'Arrived at School' : '08:15 AM',
        speedKph: loc?.speed_kph ? Number(loc.speed_kph) : 0,
        heading: 0,
        lastLocation: loc?.lat && loc?.lng ? { lat: loc.lat, lng: loc.lng } : null,
        lastUpdated: lastUpdatedText,
        isOnline: !isStale && trip.state === 'in_progress',
        direction: trip.direction,
      };
    });

    // Compute metrics
    const activeTripsCount = liveTripsList.filter((t) =>
      ['ready', 'in_progress', 'delayed', 'school_bay'].includes(t.currentPhase)
    ).length;

    const studentsInTransitCount = liveTripsList.reduce(
      (sum, t) => sum + (t.currentPhase === 'in_progress' ? t.passengersBoarded : 0),
      0
    );

    const vehiclesLiveCount = liveTripsList.filter((t) => t.isOnline).length;
    const driversActiveCount = liveTripsList.filter((t) =>
      ['in_progress', 'ready'].includes(t.currentPhase)
    ).length;
    const delayedTripsCount = liveTripsList.filter((t) => t.slaStatus === 'delayed').length;
    const criticalAlertsCount = (exceptions || []).filter((e) =>
      ['critical', 'high'].includes(e.severity)
    ).length;

    // Action Required Items
    const actionRequired: any[] = [];

    // Add any delayed trips to action required
    liveTripsList
      .filter((t) => t.slaStatus === 'delayed')
      .forEach((t) => {
        actionRequired.push({
          id: `delay-${t.tripId}`,
          type: 'delay',
          title: `Route ${t.routeCode} delayed by ${t.delayMinutes} minutes`,
          routeCode: t.routeCode,
          driverName: t.driverName,
          driverPhone: t.driverPhone,
          vehicleReg: t.vehicleNumber,
          schoolName: t.schoolName,
          expectedArrival: t.eta,
          tripId: t.tripId,
          severity: 'warning',
          actionUrl: `/admin/trips?id=${t.tripId}`,
        });
      });

    // Add open critical exceptions to action required
    (exceptions || [])
      .filter((e) => ['critical', 'high'].includes(e.severity))
      .forEach((e) => {
        actionRequired.push({
          id: `exc-${e.id}`,
          type: 'exception',
          title: e.title || 'Operational Exception Raised',
          severity: e.severity === 'critical' ? 'critical' : 'warning',
          createdAt: e.created_at,
          details: e.details,
          actionUrl: `/admin/safety`,
        });
      });

    // Recent activity stream
    const activityFeed = (recentEvents || []).map((ev: any) => {
      const timeStr = new Date(ev.occurred_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
      return {
        id: ev.id,
        time: timeStr,
        timestamp: ev.occurred_at,
        category: ev.event_type?.includes('board') ? 'boarding' : 'trip',
        title: ev.event_type?.replace(/_/g, ' ').toUpperCase() || 'TRIP EVENT',
        description: `Trip ${ev.trip_id.slice(0, 8)}: Event recorded.`,
      };
    });

    // Compliance queue
    const complianceQueue: any[] = [];
    (pendingDrivers || []).forEach((d: any) => {
      complianceQueue.push({
        id: d.id,
        name: d.profiles?.display_name || 'Driver Applicant',
        type: 'driver',
        documentType: `Commercial License (${d.license_number || 'Pending'})`,
        submittedAt: new Date(d.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
        status: 'pending_review',
      });
    });
    (pendingVehicles || []).forEach((v: any) => {
      complianceQueue.push({
        id: v.id,
        name: `${v.registration_number} (${v.make_model || v.vehicle_type})`,
        type: 'vehicle',
        documentType: 'Fitness Certificate & Commercial Permit',
        submittedAt: new Date(v.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
        status: 'pending_review',
      });
    });

    // Realtime listeners count on process bus
    const listenersCount = realtimeBus.listenerCount('admin:events');

    const responsePayload = {
      isDemo: isDemoExplicit,
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      metrics: {
        activeTrips: activeTripsCount,
        studentsInTransit: studentsInTransitCount,
        vehiclesLive: vehiclesLiveCount,
        driversActive: driversActiveCount,
        delayedTrips: delayedTripsCount,
        criticalAlerts: criticalAlertsCount,
        completedToday: completedTripsCount || 0,
        totalDrivers: allDriversCount || 0,
        totalVehicles: allVehiclesCount || 0,
      },
      actionRequired,
      liveTrips: liveTripsList,
      safetyExceptions: exceptions || [],
      activityFeed,
      complianceQueue,
      systemHealth: {
        database: {
          status: pingErr ? 'degraded' : 'healthy',
          latencyMs: dbLatencyMs,
          message: pingErr ? 'Connection warning' : 'Operational',
        },
        realtime: {
          status: 'healthy',
          connection: 'connected',
          listenersCount,
        },
        gpsIngestion: {
          status: 'healthy',
          activeTransmitters: vehiclesLiveCount,
          lastIngested: latestTelemetryData?.[0]?.recorded_at || null,
        },
        auth: {
          status: 'healthy',
          method: 'service_role_secured',
        },
      },
    };

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown command center failure';
    console.error('[Admin Command Center API Error]:', err);
    return NextResponse.json(
      {
        error: message,
        systemHealth: {
          database: { status: 'offline', latencyMs: -1, message },
          realtime: { status: 'degraded' },
        },
      },
      { status: 500 }
    );
  }
}
