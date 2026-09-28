import { NextResponse } from 'next/server';
import { getAuthenticatedDriver } from '@/server/auth';
import { getServiceSupabase, realtimeBus } from '@/server/supabase';

export async function POST(request: Request) {
  try {
    const driver = await getAuthenticatedDriver(request);
    if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { tripChildId, reason } = body;
    if (!tripChildId) return NextResponse.json({ error: 'tripChildId required' }, { status: 400 });

    const supabase = getServiceSupabase();

    const { data: tripChild } = await supabase
      .from('trip_children')
      .select('id, trip_id, state, trips!inner(driver_id)')
      .eq('id', tripChildId)
      .single();

    if (!tripChild) return NextResponse.json({ error: 'Trip child not found' }, { status: 404 });
    
    const tripDriverId = (tripChild.trips as any)?.driver_id;
    if (tripDriverId !== driver.driverId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nowIso = new Date().toISOString();

    await supabase
      .from('trip_children')
      .update({ state: 'absent' })
      .eq('id', tripChildId);

    await supabase.from('trip_child_events').insert({
      trip_child_id: tripChildId,
      event_type: 'marked_absent',
      from_state: tripChild.state,
      to_state: 'absent',
      occurred_at: nowIso,
      payload: { reason: reason || 'marked by driver' },
    });

    realtimeBus.emit(`trip:${tripChild.trip_id}`, {
      type: 'child_absent',
      tripChildId,
      state: 'absent',
      occurredAt: nowIso,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark absent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
