import { NextResponse } from 'next/server';
import { verifyPhoneOtpDriver, DRIVER_SESSION_COOKIE_NAME } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, token, otpToken: bodyOtpToken } = body;
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!token) return NextResponse.json({ error: '6-digit code is required' }, { status: 400 });
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/tinyride_driver_pending_otp=([^;]+)/);
    const cookieOtpToken = cookieMatch?.[1];
    const otpToken = bodyOtpToken || cookieOtpToken;
    const result = await verifyPhoneOtpDriver(phone, token, otpToken);
    const response = NextResponse.json(result);
    response.cookies.set({
      name: DRIVER_SESSION_COOKIE_NAME,
      value: result.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    response.cookies.set({ name: 'tinyride_driver_pending_otp', value: '', httpOnly: true, path: '/', maxAge: 0 });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
