import { NextResponse } from 'next/server';
import { verifyPhoneOtp, SESSION_COOKIE_NAME } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, token, otpToken: bodyOtpToken } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Mobile phone number is required' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: '6-digit verification code is required' },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/tinyride_pending_otp=([^;]+)/);
    const cookieOtpToken = cookieMatch && cookieMatch[1] ? cookieMatch[1] : undefined;
    const otpToken = bodyOtpToken || cookieOtpToken;

    const result = await verifyPhoneOtp(phone, token, otpToken);

    // Set secure session cookie on response
    const response = NextResponse.json(result);
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Clear pending OTP cookie
    response.cookies.set({
      name: 'tinyride_pending_otp',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OTP verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
