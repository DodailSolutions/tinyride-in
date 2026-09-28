import { NextResponse } from 'next/server';
import { getAuthenticatedSchool } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedSchool(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data: school } = await supabase
      .from('schools')
      .select('id, name, verification_status, status, address')
      .eq('id', auth.schoolId)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.userId,
        name: auth.displayName,
        phone: auth.phone,
        staffRole: auth.staffRole,
      },
      school: school || {
        id: auth.schoolId,
        name: 'School',
        verificationStatus: auth.schoolStatus,
        status: 'active',
      },
    });
  } catch (err: any) {
    console.error('[School Session API] Error:', err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
