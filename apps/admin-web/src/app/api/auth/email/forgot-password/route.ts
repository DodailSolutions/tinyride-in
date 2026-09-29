import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, redirectTo } = body || {};

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const host = request.headers.get('origin') || request.headers.get('host') || '';
    const resetUrl = redirectTo || (host.startsWith('http') ? `${host}/reset-password` : `https://${host}/reset-password`);

    const result = await requestPasswordReset(email, resetUrl);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Request failed' },
      { status: 400 }
    );
  }
}
