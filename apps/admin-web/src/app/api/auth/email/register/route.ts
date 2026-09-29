import { NextResponse } from 'next/server';
import { registerWithEmail } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, role, phone, metadata } = body || {};

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required.' },
        { status: 400 }
      );
    }

    if (!['parent', 'driver', 'school'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid registration role.' },
        { status: 400 }
      );
    }

    const result = await registerWithEmail({
      email,
      password,
      displayName,
      role,
      phone,
      metadata,
    });

    const response = NextResponse.json({
      success: true,
      needsVerification: result.needsVerification,
      message: result.message,
      user: result.sessionResult?.user,
      redirectTo: result.sessionResult?.redirectTo || (result.needsVerification ? undefined : `/${role}`),
    });

    if (result.sessionResult) {
      response.cookies.set({
        name: result.sessionResult.cookieName,
        value: result.sessionResult.sessionToken,
        httpOnly: true,
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
