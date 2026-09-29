import { NextResponse } from 'next/server';
import { loginWithEmail } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await loginWithEmail(email, password, role);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: result.user,
      redirectTo: result.redirectTo,
    });

    response.cookies.set({
      name: result.cookieName,
      value: result.sessionToken,
      httpOnly: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication failed' },
      { status: 400 }
    );
  }
}
