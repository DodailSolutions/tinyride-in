import { NextResponse } from 'next/server';
import { verifyPhoneOtp, SESSION_COOKIE_NAME } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, token } = body;

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

    const result = await verifyPhoneOtp(phone, token);

    // Set secure cookie on response
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

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OTP verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
