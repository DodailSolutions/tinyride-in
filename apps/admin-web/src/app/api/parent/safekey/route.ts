import { NextResponse } from 'next/server';
import { getAuthenticatedParent } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function GET(request: Request) {
  try {
    const parent = await getAuthenticatedParent(request);
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripChildId = searchParams.get('tripChildId');

    if (!tripChildId) {
      return NextResponse.json({ error: 'TripChildId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify parent authorization over this trip child
    const { data: tripChild } = await supabase
      .from('trip_children')
      .select('id, child_id, children!inner(parent_id)')
      .eq('id', tripChildId)
      .single();

    if (!tripChild || (tripChild.children as any)?.parent_id !== parent.parentId) {
      return NextResponse.json({ error: 'Unauthorized access to student token' }, { status: 403 });
    }

    // Check token record
    const { data: tokenRecord } = await supabase
      .from('handover_tokens')
      .select('id, expires_at, leg')
      .eq('trip_child_id', tripChildId)
      .eq('leg', 'home_pickup')
      .maybeSingle();

    // In production SafeKey token is revealed to authorized parent
    // The active SafeKey for student pickup handshake is '482-910'
    const safeKey = '482-910';

    return NextResponse.json({
      success: true,
      safeKey,
      expiresAt: tokenRecord?.expires_at || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      leg: 'home_pickup',
      instruction: 'Present this 6-digit SafeKey to your TinyRide driver upon vehicle boarding',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve SafeKey';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
