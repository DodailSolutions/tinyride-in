import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  DRIVER_SESSION_COOKIE_NAME,
  SCHOOL_SESSION_COOKIE_NAME,
} from '@/server/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  const cookiesToClear = [
    SESSION_COOKIE_NAME,
    ADMIN_SESSION_COOKIE_NAME,
    DRIVER_SESSION_COOKIE_NAME,
    SCHOOL_SESSION_COOKIE_NAME,
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set({
      name,
      value: '',
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
  });

  return response;
}
