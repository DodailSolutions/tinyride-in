import { NextResponse } from 'next/server';
import { getAuthenticatedParent } from '@/server/auth';
import { getServiceSupabase, realtimeBus } from '@/server/supabase';

export async function POST(request: Request) {
  try {
    const parent = await getAuthenticatedParent(request);
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { tripChildId, reason = 'Reported by parent' } = body;

    if (!tripChildId) {
      return NextResponse.json({ error: 'tripChildId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify parent ownership
    const { data: tripChild } = await supabase
      .from('trip_children')
      .select('id, trip_id, child_id, children!inner(parent_id, first_name)')
      .eq('id', tripChildId)
      .single();

    if (!tripChild || (tripChild.children as any)?.parent_id !== parent.parentId) {
      return NextResponse.json({ error: 'Unauthorized to mark this child absent' }, { status: 403 });
    }

    // 1. Record child absence
    const todayStr = new Date().toISOString().split('T')[0];
    await supabase.from('child_absences').insert({
      child_id: tripChild.child_id,
      absence_date: todayStr,
      direction: 'am',
      reason,
      reported_by: parent.userId,
    });

    // 2. Update trip_children state to 'absent'
    await supabase
      .from('trip_children')
      .update({ state: 'absent' })
      .eq('id', tripChildId);

    // 3. Add trip_child_events record
    await supabase.from('trip_child_events').insert({
      trip_child_id: tripChildId,
      event_type: 'marked_absent',
      actor_user_id: parent.userId,
      actor_role: 'parent',
      from_state: 'pending',
      to_state: 'absent',
      payload: { reason },
    });

    // 4. Broadcast event to driver and parent clients
    realtimeBus.emit(`trip:${tripChild.trip_id}`, {
      type: 'child_absent',
      tripChildId,
      state: 'absent',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Student marked absent for today’s ride. Manifest updated.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark absence';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
