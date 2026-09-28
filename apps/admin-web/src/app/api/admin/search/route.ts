import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 2) {
    return NextResponse.json({
      query: q,
      results: {
        drivers: [],
        vehicles: [],
        schools: [],
        students: [],
        routes: [],
        trips: [],
      },
    });
  }

  try {
    const supabase = getServiceSupabase();
    const pattern = `%${q}%`;

    const [
      { data: drivers },
      { data: vehicles },
      { data: schools },
      { data: students },
      { data: routes },
      { data: trips },
    ] = await Promise.all([
      supabase
        .from('drivers')
        .select('id, license_number, state, profiles(display_name, phone_e164)')
        .or(`license_number.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('vehicles')
        .select('id, registration_number, vehicle_type, make_model, state')
        .or(`registration_number.ilike.${pattern},make_model.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('schools')
        .select('id, name, address, contact_phone_e164, status')
        .or(`name.ilike.${pattern},address.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('children')
        .select('id, first_name, last_name, grade, status, school_id')
        .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('routes')
        .select('id, code, name, school_id')
        .or(`code.ilike.${pattern},name.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('trips')
        .select('id, state, trip_date, direction')
        .limit(5),
    ]);

    // Also search profiles for drivers whose display_name matches
    const { data: matchedProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, phone_e164')
      .or(`display_name.ilike.${pattern},phone_e164.ilike.${pattern}`)
      .limit(5);

    let driverResults: any[] = (drivers || []).map((d: any) => ({
      id: d.id,
      title: d.profiles?.display_name || d.license_number,
      subtitle: `License: ${d.license_number} · Status: ${d.state}`,
      link: `/admin/drivers?id=${d.id}`,
      type: 'Driver',
    }));

    if (matchedProfiles && matchedProfiles.length > 0) {
      const userIds = matchedProfiles.map((p) => p.id);
      const { data: profileDrivers } = await supabase
        .from('drivers')
        .select('id, license_number, state, user_id')
        .in('user_id', userIds);

      if (profileDrivers) {
        for (const pd of profileDrivers) {
          if (!driverResults.some((dr) => dr.id === pd.id)) {
            const p = matchedProfiles.find((mp) => mp.id === pd.user_id);
            driverResults.push({
              id: pd.id,
              title: p?.display_name || 'Driver',
              subtitle: `Phone: ${p?.phone_e164 || 'N/A'} · License: ${pd.license_number}`,
              link: `/admin/drivers?id=${pd.id}`,
              type: 'Driver',
            });
          }
        }
      }
    }

    const vehicleResults = (vehicles || []).map((v: any) => ({
      id: v.id,
      title: v.registration_number,
      subtitle: `${v.make_model || v.vehicle_type} · Status: ${v.state}`,
      link: `/admin/vehicles?id=${v.id}`,
      type: 'Vehicle',
    }));

    const schoolResults = (schools || []).map((s: any) => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.address || 'Hyderabad'} · Phone: ${s.contact_phone_e164 || 'N/A'}`,
      link: `/admin/schools?id=${s.id}`,
      type: 'School',
    }));

    const studentResults = (students || []).map((st: any) => ({
      id: st.id,
      title: `${st.first_name} ${st.last_name || ''}`.trim(),
      subtitle: `Grade: ${st.grade || 'N/A'} · Status: ${st.status}`,
      link: `/admin/students?id=${st.id}`,
      type: 'Student',
    }));

    const routeResults = (routes || []).map((r: any) => ({
      id: r.id,
      title: `${r.code} — ${r.name}`,
      subtitle: `Route Code: ${r.code}`,
      link: `/admin/routes?id=${r.id}`,
      type: 'Route',
    }));

    const tripResults = (trips || []).map((t: any) => ({
      id: t.id,
      title: `Trip ${t.id.slice(0, 8)} (${t.direction?.toUpperCase()})`,
      subtitle: `Date: ${t.trip_date} · State: ${t.state}`,
      link: `/admin/trips?id=${t.id}`,
      type: 'Trip',
    }));

    return NextResponse.json({
      query: q,
      results: {
        drivers: driverResults,
        vehicles: vehicleResults,
        schools: schoolResults,
        students: studentResults,
        routes: routeResults,
        trips: tripResults,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
