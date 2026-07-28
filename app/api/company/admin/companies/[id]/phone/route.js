import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function PUT(request, { params }) {
  const admin = await getCurrentCompany();
  if (!admin) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!admin.is_platform_admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { phoneNumber } = await request.json();

    const clean = (phoneNumber || '').trim();
    if (clean && !/^\+1\d{10}$/.test(clean)) {
      return NextResponse.json(
        { error: 'Phone number must be in the format +1XXXXXXXXXX, or blank to unassign.' },
        { status: 400 }
      );
    }

    await ensureSchema();

    if (clean) {
      const taken = await sql`
        SELECT id FROM companies WHERE twilio_phone_number = ${clean} AND id != ${id}
      `;
      if (taken.length > 0) {
        return NextResponse.json(
          { error: 'That number is already assigned to another company.' },
          { status: 409 }
        );
      }
    }

    await sql`
      UPDATE companies SET twilio_phone_number = ${clean || null} WHERE id = ${id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
