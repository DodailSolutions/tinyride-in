import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedParent } from '@/server/auth';
import { getServiceSupabase, formatPointWKT } from '@/server/supabase';

export async function POST(request: Request) {
  try {
    const parent = await getAuthenticatedParent(request);
    if (!parent) {
      return NextResponse.json({ error: 'Unauthorized parent session' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      parentName,
      studentName,
      grade = 'Grade 3A',
      schoolId,
      pickupAddress = 'Gate 2, Rainbow Vistas, Moosapet, Hyderabad',
      pickupLng = 78.3970,
      pickupLat = 17.4720,
    } = body;

    if (!studentName || typeof studentName !== 'string') {
      return NextResponse.json({ error: 'Student full name is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Update parent display name in public.profiles
    if (parentName) {
      await supabase
        .from('profiles')
        .update({ display_name: parentName.trim() })
        .eq('id', parent.userId);
    }

    // 2. Resolve target school (use requested or first active school)
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const { data: schools } = await supabase.from('schools').select('id').limit(1);
      targetSchoolId = schools?.[0]?.id;
    }

    if (!targetSchoolId) {
      return NextResponse.json({ error: 'School not found in system' }, { status: 400 });
    }

    // Split student name
    const nameParts = studentName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // 3. Insert or find child record in public.children
    let childId: string;
    const { data: existingChild } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', parent.parentId)
      .eq('first_name', firstName)
      .maybeSingle();

    if (existingChild) {
      childId = existingChild.id;
    } else {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 8); // ~8 years old
      const dobStr = dob.toISOString().split('T')[0];

      const { data: newChild, error: childErr } = await supabase
        .from('children')
        .insert({
          parent_id: parent.parentId,
          school_id: targetSchoolId,
          first_name: firstName,
          last_name: lastName || null,
          date_of_birth: dobStr,
          grade: grade || 'Grade 3A',
          status: 'active',
        })
        .select('id')
        .single();

      if (childErr || !newChild) {
        console.error('[Onboarding] Error inserting child:', childErr);
        return NextResponse.json({ error: 'Failed to create student record' }, { status: 400 });
      }
      childId = newChild.id;
    }

    // 4. Create family location in public.family_locations
    const geoWkt = formatPointWKT(pickupLng, pickupLat);
    await supabase.from('family_locations').upsert(
      {
        parent_id: parent.parentId,
        label: 'Home Pickup',
        address: pickupAddress,
        geo: geoWkt,
        is_default: true,
      },
      { onConflict: 'parent_id, label' }
    );

    // 5. Connect child to active Route & Schedule & Today's Trip
    const { data: routes } = await supabase
      .from('routes')
      .select('id')
      .eq('school_id', targetSchoolId)
      .limit(1);

    const activeRouteId = routes?.[0]?.id;
    if (activeRouteId) {
      // Find morning schedule
      const { data: schedules } = await supabase
        .from('route_schedules')
        .select('id')
        .eq('route_id', activeRouteId)
        .eq('direction', 'am')
        .limit(1);

      const activeScheduleId = schedules?.[0]?.id;

      // Find route stops
      const { data: stops } = await supabase
        .from('route_stops')
        .select('id, stop_type')
        .eq('route_id', activeRouteId);

      const pickupStop =
        stops?.find((s) => s.stop_type === 'pickup') || stops?.[0];
      const schoolStop =
        stops?.find((s) => s.stop_type === 'school') || stops?.[stops.length - 1];

      if (activeScheduleId && pickupStop && schoolStop) {
        // Create Booking if not exists
        let bookingId: string;
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('child_id', childId)
          .eq('schedule_id', activeScheduleId)
          .maybeSingle();

        if (existingBooking) {
          bookingId = existingBooking.id;
        } else {
          const serviceStart = new Date().toISOString().split('T')[0];
          const { data: newBooking, error: bErr } = await supabase
            .from('bookings')
            .insert({
              parent_id: parent.parentId,
              child_id: childId,
              route_id: activeRouteId,
              schedule_id: activeScheduleId,
              pickup_stop_id: pickupStop.id,
              dropoff_stop_id: schoolStop.id,
              service_start: serviceStart,
              amount_minor: 350000, // 3,500 INR
              state: 'confirmed',
              confirmed_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (bErr) console.warn('[Onboarding] Booking creation warning:', bErr);
          bookingId = newBooking?.id || '';
        }

        // Connect to Today's Trip
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: trips } = await supabase
          .from('trips')
          .select('id')
          .eq('schedule_id', activeScheduleId)
          .eq('trip_date', todayStr)
          .maybeSingle();

        if (trips && bookingId) {
          const tripId = trips.id;
          let tripChildId: string;

          const { data: existingTc } = await supabase
            .from('trip_children')
            .select('id')
            .eq('trip_id', tripId)
            .eq('child_id', childId)
            .maybeSingle();

          if (existingTc) {
            tripChildId = existingTc.id;
          } else {
            const { data: newTc, error: tcErr } = await supabase
              .from('trip_children')
              .insert({
                trip_id: tripId,
                trip_date: todayStr,
                child_id: childId,
                booking_id: bookingId,
                pickup_stop_id: pickupStop.id,
                dropoff_stop_id: schoolStop.id,
                sequence_no: 1,
                state: 'pending',
                required_legs: ['home_pickup', 'school_receipt'],
              })
              .select('id')
              .single();

            if (tcErr) console.warn('[Onboarding] TripChild warning:', tcErr);
            tripChildId = newTc?.id || '';
          }

          // 6. Generate SafeKey token for student boarding handshake
          if (tripChildId) {
            const safeKeyCode = '482910'; // Deterministic 6-digit or random
            const salt = crypto.randomBytes(16);
            const hash = crypto.scryptSync(safeKeyCode, salt, 32);

            const expiresAt = new Date();
            expiresAt.setHours(23, 59, 59, 999);

            await supabase.from('handover_tokens').upsert(
              {
                trip_child_id: tripChildId,
                leg: 'home_pickup',
                token_hash: hash,
                token_salt: salt,
                issued_to: parent.userId,
                expires_at: expiresAt.toISOString(),
                max_attempts: 5,
              },
              { onConflict: 'trip_child_id, leg' }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      childId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Onboarding failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
