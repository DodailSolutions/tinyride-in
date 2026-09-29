import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/server/supabase';
import { getAuthenticatedAdmin } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Central Administrator session required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, targetId, note = '', metadata = {} } = body;

    if (!action || !targetId) {
      return NextResponse.json({ error: 'Action and targetId are required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    switch (action) {
      case 'approve_driver': {
        const { error } = await supabase
          .from('drivers')
          .update({ state: 'approved', approved_at: new Date().toISOString() })
          .eq('id', targetId);

        if (error) throw error;

        // Log audit
        await supabase.from('audit_logs').insert({
          action: 'update',
          table_name: 'drivers',
          record_id: targetId,
          after_data: { state: 'approved', note },
        });

        return NextResponse.json({ success: true, message: 'Driver approved successfully' });
      }

      case 'approve_vehicle': {
        const { error } = await supabase
          .from('vehicles')
          .update({ state: 'approved', approved_at: new Date().toISOString() })
          .eq('id', targetId);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          action: 'update',
          table_name: 'vehicles',
          record_id: targetId,
          after_data: { state: 'approved', note },
        });

        return NextResponse.json({ success: true, message: 'Vehicle approved successfully' });
      }

      case 'resolve_exception': {
        const { error } = await supabase
          .from('exceptions')
          .update({
            state: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_note: note || 'Resolved by Platform Admin',
          })
          .eq('id', targetId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Exception resolved successfully' });
      }

      case 'notify_school': {
        // Find school for trip or school directly
        let schoolId = metadata.schoolId;
        if (!schoolId && metadata.tripId) {
          const { data: trip } = await supabase
            .from('trips')
            .select('route_id, routes(school_id)')
            .eq('id', metadata.tripId)
            .single();
          schoolId = (trip as any)?.routes?.school_id;
        }

        if (schoolId) {
          const { data: schoolStaff } = await supabase
            .from('school_users')
            .select('user_id')
            .eq('school_id', schoolId);

          if (schoolStaff && schoolStaff.length > 0) {
            const notifications = schoolStaff.map((st) => ({
              user_id: st.user_id,
              notification_type: 'trip_delay',
              title: metadata.title || 'Operational Notification from Central Command',
              body: note || 'Route is currently experiencing traffic delay. ETA updated.',
              trip_id: metadata.tripId || null,
            }));
            await supabase.from('notifications').insert(notifications);
          }
        }

        return NextResponse.json({ success: true, message: 'School operations staff notified' });
      }

      case 'contact_driver': {
        // Return driver contact info and record audit trail
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, profiles(display_name, phone_e164)')
          .eq('id', targetId)
          .single();

        return NextResponse.json({
          success: true,
          message: 'Driver contact requested',
          contact: {
            name: (driver as any)?.profiles?.display_name || 'Driver',
            phone: (driver as any)?.profiles?.phone_e164 || '',
          },
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
