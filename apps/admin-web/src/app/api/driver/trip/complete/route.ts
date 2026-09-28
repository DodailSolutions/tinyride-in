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
        state: 'completed',
        actual_end: nowIso,
      })
      .eq('id', tripId)
      .select('id, state, actual_end')
      .single();

    if (tripErr || !trip) {
      return NextResponse.json({ error: 'Failed to complete trip' }, { status: 400 });
    }

    await supabase.from('trip_events').insert({
      trip_id: tripId,
      event_type: 'trip_ended',
      occurred_at: nowIso,
      payload: { actor: 'driver', status: 'completed' },
    });

    realtimeBus.emit(`trip:${tripId}`, {
      type: 'trip_status',
      tripId,
      state: 'completed',
      occurredAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Trip completed successfully',
      trip,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to complete trip';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
