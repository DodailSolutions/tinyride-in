import { NextResponse } from 'next/server';
import { getAuthenticatedSchool } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedSchool(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized school session' },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();
    const schoolId = auth.schoolId;

    // 1. Fetch School details
    const { data: school } = await supabase
      .from('schools')
      .select('id, name, verification_status, status, address, am_arrive_by, pm_release_at')
      .eq('id', schoolId)
      .single();

    // 2. Fetch Routes for this school
    const { data: routes } = await supabase
      .from('routes')
      .select(`
        id,
        code,
        name,
        direction,
        status,
        stops_count,
        created_at
      `)
      .eq('school_id', schoolId)
      .order('code', { ascending: true });

    // 3. Fetch Enrolled Children for this school
    const { data: students } = await supabase
      .from('children')
      .select(`
        id,
        first_name,
        last_name,
        grade,
        section,
        school_roll_no,
        status,
        created_at
      `)
      .eq('school_id', schoolId)
      .order('first_name', { ascending: true });

    // 4. Fetch Active & Recent Trips for this school
    const { data: trips } = await supabase
      .from('trips')
      .select(`
        id,
        route_id,
        driver_id,
        vehicle_id,
        state,
        direction,
        scheduled_start_at,
        actual_start_at,
        completed_at,
        students_boarded_count,
        expected_passengers,
        created_at,
        routes ( name, code ),
        drivers:driver_id (
          profiles:user_id ( full_name, phone_e164 )
        ),
        vehicles:vehicle_id ( registration_number, vehicle_type )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Compute metrics
    const activeRoutesCount = (routes || []).filter((r) => r.status === 'active').length;
    const activeTrips = (trips || []).filter((t) => t.state === 'in_progress');
    const completedTrips = (trips || []).filter((t) => t.state === 'completed');
    const studentsCount = (students || []).length;

    return NextResponse.json({
      school: school || {
        id: schoolId,
        name: 'School',
        verification_status: auth.schoolStatus,
      },
      metrics: {
        totalRoutes: (routes || []).length,
        activeRoutes: activeRoutesCount,
        activeTrips: activeTrips.length,
        completedTrips: completedTrips.length,
        enrolledStudents: studentsCount,
      },
      routes: routes || [],
      students: students || [],
      trips: trips || [],
    });
  } catch (err: any) {
    console.error('[School Data API] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch school operational data' },
      { status: 500 }
    );
  }
}
