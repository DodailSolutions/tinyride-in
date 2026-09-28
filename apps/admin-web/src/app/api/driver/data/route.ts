import { NextResponse } from 'next/server';
import { getAuthenticatedDriver } from '@/server/auth';
import { getServiceSupabase, parsePointHex } from '@/server/supabase';

export async function GET(request: Request) {
  try {
    const driver = await getAuthenticatedDriver(request);
    if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    
    // Get driver profile
    const { data: driverRec } = await supabase
      .from('drivers')
      .select('id, state')
      .eq('id', driver.driverId)
      .maybeSingle();

    // Get vehicle
    const { data: dva } = await supabase
      .from('driver_vehicle_assignments')
      .select('vehicle_id, vehicles!inner(id, registration_number, make_model, vehicle_type)')
      .eq('driver_id', driver.driverId)
      .is('revoked_at', null)
      .maybeSingle();
      
    const vehicle = dva?.vehicles as any;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Today's trips
    const { data: todayTrips } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_date', todayStr)
      .eq('driver_id', driver.driverId);

    // Active trip detail
    const active = todayTrips?.find(t => t.state === 'in_progress');
    let activeTripDetail = null;

    if (active) {
      const { data: route } = await supabase
        .from('routes')
        .select('name, schools!inner(name, address, geo)')
        .eq('id', active.route_id)
        .single();
        
      const { data: rawStops } = await supabase
        .from('route_stops')
        .select('id, name, address, geo, stop_type')
        .eq('route_id', active.route_id);
        
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

      const { data: manifest } = await supabase
        .from('trip_children')
        .select('id, child_id, state, pickup_stop_id, dropoff_stop_id, sequence_no, children!inner(first_name, last_name, grade)')
        .eq('trip_id', active.id);
        
      const students = (manifest || []).map((m) => {
        const child = m.children as any;
        const stop = routeStops.find((s) => s.id === m.pickup_stop_id);
        return {
          tripChildId: m.id,
          childId: m.child_id,
          name: `${child.first_name}${child.last_name ? ' ' + child.last_name : ''}`,
          grade: child.grade,
          stopName: stop?.name,
          state: m.state,
        };
      });

      activeTripDetail = {
        ...active,
        routeName: route?.name,
        schoolName: (route?.schools as any)?.name,
        routeStops,
        students,
      };
    }

    return NextResponse.json({
      driver: {
        id: driver.driverId,
        name: driver.displayName,
        phone: driver.phone,
        status: driverRec?.state || 'unknown',
      },
      vehicle: vehicle ? {
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        makeModel: vehicle.make_model,
        vehicleType: vehicle.vehicle_type,
      } : null,
      todayTrips: todayTrips || [],
      activeTrip: activeTripDetail
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch driver data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
