import { NextResponse } from 'next/server';
import { getAuthenticatedDriver } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function GET(request: Request) {
  const driver = await getAuthenticatedDriver(request);
  if (!driver) return NextResponse.json({ authenticated: false }, { status: 401 });
  
  const supabase = getServiceSupabase();
  
  // Get driver profile
  const { data: driverRec } = await supabase
    .from('drivers')
    .select('id, state, license_number, approved_at')
    .eq('id', driver.driverId)
    .maybeSingle();
  
  // Get active vehicle assignment
  const { data: dva } = await supabase
    .from('driver_vehicle_assignments')
    .select('vehicle_id, vehicles!inner(id, registration_number, make_model, vehicle_type, capacity)')
    .eq('driver_id', driver.driverId)
    .is('revoked_at', null)
    .maybeSingle();
  
  const vehicle = dva?.vehicles as any;
  
  return NextResponse.json({
    authenticated: true,
    driver: {
      id: driver.driverId,
      userId: driver.userId,
      name: driver.displayName,
      phone: driver.phone,
      status: driverRec?.state || 'unknown',
    },
    vehicle: vehicle ? {
      id: vehicle.id,
      registrationNumber: vehicle.registration_number,
      makeModel: vehicle.make_model,
      vehicleType: vehicle.vehicle_type,
      capacity: vehicle.capacity,
    } : null,
  });
}
