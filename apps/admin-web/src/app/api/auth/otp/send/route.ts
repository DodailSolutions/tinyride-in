import { NextResponse } from 'next/server';
import { sendPhoneOtp } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Mobile phone number is required' },
        { status: 400 }
      );
    }

    const result = await sendPhoneOtp(phone);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send verification code';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
