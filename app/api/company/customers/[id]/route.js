import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function PUT(request, { params }) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { id } = await params;
    const { name, email, phone, emailOptIn, smsOptIn } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Provide at least an email or a phone number.' },
        { status: 400 }
      );
    }

    await ensureSchema();

    const rows = await sql`
      UPDATE customers
      SET name = ${name || null},
          email = ${email || null},
          phone = ${phone || null},
          email_opt_in = ${!!emailOptIn},
          sms_opt_in = ${!!smsOptIn}
      WHERE id = ${id} AND company_id = ${company.id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ customer: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong updating the customer.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  await sql`DELETE FROM customers WHERE id = ${id} AND company_id = ${company.id}`;
  return NextResponse.json({ ok: true });
}
