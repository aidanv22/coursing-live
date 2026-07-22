import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, website, phone, serviceArea } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Company name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    await ensureSchema();

    const existing = await sql`SELECT id FROM companies WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with that email already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const rows = await sql`
      INSERT INTO companies (name, email, password_hash, website, phone, service_area)
      VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, ${website || null}, ${phone || null}, ${serviceArea || null})
      RETURNING id
    `;

    await createSession(rows[0].id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong creating the account.' },
      { status: 500 }
    );
  }
}
