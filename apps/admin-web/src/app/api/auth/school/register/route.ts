import { NextResponse } from 'next/server';
import { sendPhoneOtp, normalizePhone } from '@/server/auth';
import { getServiceSupabase } from '@/server/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { schoolName, adminName, phone } = body;

    if (!schoolName?.trim()) {
      return NextResponse.json(
        { error: 'School institution name is required' },
        { status: 400 }
      );
    }

    if (!adminName?.trim()) {
      return NextResponse.json(
        { error: 'Administrator / Transport Coordinator name is required' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Contact phone number is required' },
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

    // Check if school with this name already exists in same city
    const supabase = getServiceSupabase();
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id, name')
      .ilike('name', schoolName.trim())
      .maybeSingle();

    if (existingSchool) {
      return NextResponse.json(
        {
          error:
            'A school with this name is already registered on TinyRide. Please sign in or contact support.',
        },
        { status: 409 }
      );
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
    console.error('[School Register] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to dispatch verification code' },
      { status: 500 }
    );
  }
}
