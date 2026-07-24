import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany, verifyPassword } from '@/lib/auth';

export async function PUT(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { currentPassword, newEmail } = await request.json();

    if (!currentPassword || !newEmail) {
      return NextResponse.json(
        { error: 'Current password and new email are both required.' },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(currentPassword, company.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    await ensureSchema();

    const existing = await sql`
      SELECT id FROM companies WHERE email = ${newEmail.toLowerCase()} AND id != ${company.id}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'That email is already in use by another account.' },
        { status: 409 }
      );
    }

    await sql`UPDATE companies SET email = ${newEmail.toLowerCase()} WHERE id = ${company.id}`;

    return NextResponse.json({ ok: true, email: newEmail.toLowerCase() });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong updating your email.' }, { status: 500 });
  }
}
