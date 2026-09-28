import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE_NAME, signAdminSessionToken } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, passcode } = body || {};

    if (!email || !passcode) {
      return NextResponse.json(
        { error: 'Email and security key/passcode are required.' },
        { status: 400 }
      );
    }

    const token = signAdminSessionToken(email);

    const response = NextResponse.json({
      success: true,
      message: 'Admin console authenticated',
      user: {
        role: 'admin',
        displayName: 'Central Controller (Platform Admin)',
      },
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
