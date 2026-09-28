import { NextResponse } from 'next/server';
import { getAuthenticatedParent } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function GET(request: Request) {
  try {
    const parent = await getAuthenticatedParent(request);
    if (!parent) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Refresh child count / onboarding status from DB
    const supabase = getServiceSupabase();
    const { count } = await supabase
      .from('children')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', parent.parentId)
      .neq('status', 'graduated');

    const onboardingStatus: 'incomplete' | 'complete' =
      count && count > 0 ? 'complete' : 'incomplete';

    return NextResponse.json({
      authenticated: true,
      user: {
        id: parent.userId,
        phone: parent.phone,
        displayName: parent.displayName,
        role: 'parent',
        onboardingStatus,
      },
      parentId: parent.parentId,
      onboardingStatus,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
