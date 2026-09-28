import { NextResponse } from 'next/server';
import { getServiceSupabase, parsePointHex } from '@/server/supabase';
import { getAuthenticatedDriver } from '@/server/auth';

export async function GET(request: Request) {
  try {
    const driver = await getAuthenticatedDriver(request);
    if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const todayStr = new Date().toISOString().split('T')[0];

    // Find today's active or scheduled trip
    const { data: trips } = await supabase
      .from('trips')
      .select('id, state, scheduled_start, actual_start, direction, route_id, driver_id, vehicle_id')
      .eq('trip_date', todayStr)
      .eq('driver_id', driver.driverId)
      .limit(1);

    const trip = trips?.[0];
    if (!trip) {
      return NextResponse.json({ hasTrip: false, message: 'No trips scheduled for today' });
    }

    // Driver & vehicle details
    const { data: driverRec } = await supabase
      .from('drivers')
      .select('id, profiles!inner(display_name, phone_e164)')
      .eq('id', trip.driver_id)
      .single();

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('make_model, registration_number')
      .eq('id', trip.vehicle_id)
      .single();

    const { data: route } = await supabase
      .from('routes')
      .select('name, schools!inner(name, address, geo)')
      .eq('id', trip.route_id)
      .single();

    // Route stops
    const { data: rawStops } = await supabase
      .from('route_stops')
      .select('id, name, address, geo, stop_type')
      .eq('route_id', trip.route_id);

    const routeStops = (rawStops || []).map((s) => {
      const pt = parsePointHex(s.geo);
      return {
        id: s.id,
        name: s.name,
        address: s.address,
        stopType: s.stop_type,
        lat: pt?.lat || 17.4720,
        lng: pt?.lng || 78.3970,
      };
    });

    // Student manifest
    const { data: manifest } = await supabase
      .from('trip_children')
      .select('id, child_id, state, pickup_stop_id, dropoff_stop_id, sequence_no, children!inner(first_name, last_name, grade)')
      .eq('trip_id', trip.id);

    const students = (manifest || []).map((m) => {
      const child = m.children as any;
      const stop = routeStops.find((s) => s.id === m.pickup_stop_id);
      return {
        tripChildId: m.id,
        childId: m.child_id,
        name: `${child.first_name}${child.last_name ? ' ' + child.last_name : ''}`,
        grade: child.grade || 'Primary',
        stopName: stop?.name || 'Rainbow Vistas Gate 2',
        state: m.state,
      };
    });

    return NextResponse.json({
      hasTrip: true,
      trip: {
        id: trip.id,
        state: trip.state,
        direction: trip.direction,
        scheduledStart: trip.scheduled_start,
        actualStart: trip.actual_start,
        routeName: route?.name || 'Route 04 Express',
        schoolName: (route?.schools as any)?.name || 'Olive Mount Global School',
        driverName: (driverRec?.profiles as any)?.display_name || 'Ravi Kumar',
        driverPhone: (driverRec?.profiles as any)?.phone_e164 || '+91 98765 00001',
        vehicleNumber: vehicle?.registration_number || 'TS09-TR-102',
        vehicleModel: vehicle?.make_model || 'Force Traveller 18-Seater',
        routeStops,
        students,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch driver trip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
