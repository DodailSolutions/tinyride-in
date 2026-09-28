import { NextResponse } from 'next/server';
import { sendPhoneOtp, normalizePhone } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    // Check if phone belongs to an existing school staff user
    const supabase = getServiceSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone_e164', cleanPhone)
      .maybeSingle();

    if (profile) {
      const { data: schoolUser } = await supabase
        .from('school_users')
        .select('id, school_id')
        .eq('user_id', profile.id)
        .is('revoked_at', null)
        .maybeSingle();

      if (!schoolUser) {
        return NextResponse.json(
          {
            error:
              'No active school transport account found with this phone number. Please register your school first.',
            notRegistered: true,
          },
          { status: 404 }
        );
      }
    }

    // Send 6-digit OTP
    const result = await sendPhoneOtp(cleanPhone);

    return NextResponse.json({
      success: true,
      message: result.message,
      phone: result.phoneE164,
      expiresIn: result.expiresInSeconds,
      otpToken: result.otpToken,
      debugCode: result.debugCode,
    });
  } catch (err: any) {
    console.error('[School Auth] Error sending login OTP:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to dispatch verification code' },
      { status: 500 }
    );
  }
}
