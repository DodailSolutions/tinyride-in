import { NextResponse } from 'next/server';
import { sendPhoneOtp } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone } = body;
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    const result = await sendPhoneOtp(phone);
    const response = NextResponse.json(result);
    if (result.otpToken) {
      response.cookies.set({
        name: 'tinyride_driver_pending_otp',
        value: result.otpToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
    }
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send code';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
