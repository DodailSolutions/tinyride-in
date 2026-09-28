import { NextResponse } from 'next/server';
import { getServiceSupabase, realtimeBus, formatPointWKT } from '@/server/supabase';
import { getAuthenticatedDriver } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const driver = await getAuthenticatedDriver(request);
    if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { tripId, lat, lng } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const nowIso = new Date().toISOString();

    const { data: existingTrip } = await supabase
      .from('trips')
      .select('id, driver_id')
      .eq('id', tripId)
      .single();
      
    if (!existingTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (existingTrip.driver_id !== driver.driverId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .update({
        state: 'in_progress',
        actual_start: nowIso,
      })
      .eq('id', tripId)
      .select('id, state, actual_start')
      .single();

    if (tripErr || !trip) {
      return NextResponse.json({ error: 'Failed to start trip' }, { status: 400 });
    }

    await supabase.from('trip_events').insert({
      trip_id: tripId,
      event_type: 'trip_started',
      occurred_at: nowIso,
      payload: { actor: 'driver' },
    });
    
    if (lat !== undefined && lng !== undefined) {
      await supabase.from('trip_locations').insert({
        trip_id: tripId,
        geo: formatPointWKT(lng, lat),
        speed_kph: 0,
        accuracy_m: 5,
        recorded_at: nowIso,
      });
    }

    realtimeBus.emit(`trip:${tripId}`, {
      type: 'trip_status',
      tripId,
      state: 'in_progress',
      occurredAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Trip started successfully',
      trip,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start trip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
