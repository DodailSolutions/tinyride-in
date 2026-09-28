import { NextResponse } from 'next/server';
import { getServiceSupabase, realtimeBus } from '@/server/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const nowIso = new Date().toISOString();

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
