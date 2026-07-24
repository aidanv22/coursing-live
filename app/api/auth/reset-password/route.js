import { NextResponse } from 'next/server';
import { verifyPasswordResetToken, consumePasswordResetToken, hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Missing token or password.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const company = await verifyPasswordResetToken(token);
    if (!company) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Request a new one.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await consumePasswordResetToken(company.id, passwordHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
