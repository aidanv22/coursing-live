import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany, verifyPassword, hashPassword } from '@/lib/auth';

export async function PUT(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are both required.' },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(currentPassword, company.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    await ensureSchema();
    const newHash = await hashPassword(newPassword);

    // Bump reset_token_version too — invalidates any password reset email
    // links that might still be sitting unused in an inbox somewhere, since
    // the password is changing through a different path now.
    await sql`
      UPDATE companies
      SET password_hash = ${newHash}, reset_token_version = COALESCE(reset_token_version, 0) + 1
      WHERE id = ${company.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong updating your password.' }, { status: 500 });
  }
}
