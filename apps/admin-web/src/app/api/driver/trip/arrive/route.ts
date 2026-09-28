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

    // 1. Fetch trip and enrolled children
    const { data: trip } = await supabase
      .from('trips')
      .select('id, route_id, routes!inner(name, school_id, schools!inner(name))')
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const schoolName = (trip.routes as any)?.schools?.name || 'Olive Mount Global School';

    // 2. Update trip_children state to 'at_school'
    const { data: tripChildren } = await supabase
      .from('trip_children')
      .select('id, child_id, children!inner(first_name, parents!inner(user_id))')
      .eq('trip_id', tripId)
      .neq('state', 'absent');

    await supabase
      .from('trip_children')
      .update({ state: 'at_school' })
      .eq('trip_id', tripId)
      .neq('state', 'absent');

    // 3. Emit trip event
    await supabase.from('trip_events').insert({
      trip_id: tripId,
      event_type: 'trip_ended',
      occurred_at: nowIso,
      payload: { location: 'school_campus_bay', schoolName },
    });

    // 4. Send real parent notifications to all enrolled parents
    if (tripChildren && tripChildren.length > 0) {
      for (const tc of tripChildren) {
        const childParentId = (tc.children as any)?.parent_id;
        const childName = (tc.children as any)?.first_name || 'Your child';
        if (childParentId) {
          const { data: pRec } = await supabase.from('parents').select('user_id').eq('id', childParentId).maybeSingle();
          if (pRec?.user_id) {
            await supabase.from('notifications').insert({
              user_id: pRec.user_id,
              notification_type: 'child_dropped_off',
              trip_id: tripId,
              title: `${childName} reached campus safely`,
              body: `${childName} has arrived at ${schoolName} drop-off bay. School staff has verified arrival.`,
              created_at: nowIso,
            });
          }
        }
      }
    }

    // 5. Broadcast real-time arrival event to parents
    realtimeBus.emit(`trip:${tripId}`, {
      type: 'school_arrival',
      tripId,
      schoolName,
      state: 'at_school',
      occurredAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: `Vehicle arrived at ${schoolName}. Campus drop-off confirmed!`,
      state: 'at_school',
      occurredAt: nowIso,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'School arrival trigger failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
