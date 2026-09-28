import { NextResponse } from 'next/server';
import { DRIVER_SESSION_COOKIE_NAME } from '@/server/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: DRIVER_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
