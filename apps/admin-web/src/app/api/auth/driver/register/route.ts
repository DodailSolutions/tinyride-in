import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/server/supabase';
import { sendPhoneOtp } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      phone,
      fullName,
      licenseNumber,
    } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }
    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!licenseNumber || typeof licenseNumber !== 'string') {
      return NextResponse.json({ error: 'Driver license number is required' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanLicense = licenseNumber.trim().toUpperCase();

    const supabase = getServiceSupabase();

    // Check if phone or license already registered
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, phone_e164')
      .eq('phone_e164', cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/\D/g, '')}`)
      .maybeSingle();

    if (existingProfile) {
      // Check if driver already exists
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id, state')
        .eq('user_id', existingProfile.id)
        .maybeSingle();

      if (existingDriver) {
        return NextResponse.json({
          error: 'An account with this mobile number already exists. Please log in.',
          alreadyRegistered: true,
        }, { status: 409 });
      }
    }

    // Check if license is already registered to another driver
    const { data: licenseDriver } = await supabase
      .from('drivers')
      .select('id')
      .eq('license_number', cleanLicense)
      .maybeSingle();

    if (licenseDriver) {
      return NextResponse.json({
        error: 'This driver license number is already registered. Please log in.',
        alreadyRegistered: true,
      }, { status: 409 });
    }

    // Send OTP for phone verification
    const otpResult = await sendPhoneOtp(cleanPhone);

    const response = NextResponse.json({
      success: true,
      message: 'Verification code sent to your phone',
      otpToken: otpResult.otpToken,
      phoneE164: otpResult.phoneE164,
      debugCode: otpResult.debugCode,
    });

    if (otpResult.otpToken) {
      response.cookies.set({
        name: 'tinyride_driver_pending_otp',
        value: otpResult.otpToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
