import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    await ensureSchema();

    const rows = await sql`SELECT * FROM companies WHERE email = ${email.toLowerCase()}`;
    const company = rows[0];

    if (!company) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, company.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    await createSession(company.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong logging in.' }, { status: 500 });
  }
}
