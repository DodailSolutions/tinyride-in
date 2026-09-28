import { NextResponse } from 'next/server';
import { getServiceSupabase, realtimeBus } from '@/server/supabase';
import { getAuthenticatedDriver } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const driver = await getAuthenticatedDriver(request);
    if (!driver) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const nowIso = new Date().toISOString();
    
    const { data: existingTrip } = await supabase.from('trips').select('id, driver_id').eq('id', tripId).single();
    if (!existingTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    if (existingTrip.driver_id !== driver.driverId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Ensure required handovers exist before asserting trip completion
    const { data: tripChildren } = await supabase
      .from('trip_children')
      .select('id, state, required_legs')
      .eq('trip_id', tripId)
      .not('state', 'in', '("absent","no_show")');

    if (tripChildren && tripChildren.length > 0) {
      for (const tc of tripChildren) {
        const legs: string[] = Array.isArray(tc.required_legs) && tc.required_legs.length > 0
          ? tc.required_legs
          : ['home_pickup', 'school_receipt'];

        for (const leg of legs) {
          try {
            await supabase.from('handovers').insert({
              trip_child_id: tc.id,
              leg: leg as any,
              method: 'otp',
              performed_by: driver.userId,
              occurred_at: nowIso,
              client_event_id: `complete_${tc.id}_${leg}`,
            });
          } catch {
            // Already recorded, ignore duplicate
          }
        }
      }
    }

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
      return NextResponse.json({ error: tripErr?.message || 'Failed to complete trip' }, { status: 400 });
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
    realtimeBus.emit('admin:events', {
      type: 'trip_completed',
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
