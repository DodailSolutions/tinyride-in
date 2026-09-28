import { NextResponse } from 'next/server';
import { getServiceSupabase, formatPointWKT, realtimeBus } from '@/server/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      tripId,
      latitude,
      longitude,
      accuracy = 5,
      speed = 0,
      heading = 0,
      timestamp,
    } = body;

    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json({ error: 'Valid tripId is required' }, { status: 400 });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid geographic coordinates' },
        { status: 400 }
      );
    }

    const speedKph = Math.max(0, Math.min(120, Number(speed) || 0));
    const accuracyM = Math.max(1, Math.min(500, Number(accuracy) || 5));
    const recordedAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    const supabase = getServiceSupabase();

    // Verify trip is active
    const { data: trip } = await supabase
      .from('trips')
      .select('id, state')
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Insert into trip_locations table
    const geoWkt = formatPointWKT(lng, lat);
    const { error: locErr } = await supabase.from('trip_locations').insert({
      trip_id: tripId,
      geo: geoWkt,
      speed_kph: speedKph,
      accuracy_m: accuracyM,
      recorded_at: recordedAt,
    });

    if (locErr) {
      console.error('[Driver Location API] Error recording location:', locErr);
      return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
    }

    // Broadcast real-time location event to all connected parent clients
    const telemetryPayload = {
      type: 'location',
      tripId,
      lat,
      lng,
      speedKph,
      accuracyM,
      heading: Number(heading) || 0,
      recordedAt,
    };

    realtimeBus.emit(`trip:${tripId}`, telemetryPayload);

    return NextResponse.json({
      success: true,
      recordedAt,
      lat,
      lng,
      speedKph,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Location ingestion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
