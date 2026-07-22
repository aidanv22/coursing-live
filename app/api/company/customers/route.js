import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`
    SELECT * FROM customers WHERE company_id = ${company.id} ORDER BY created_at DESC
  `;
  return NextResponse.json({ customers: rows });
}

export async function POST(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { name, email, phone, emailOptIn, smsOptIn } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Provide at least an email or a phone number.' },
        { status: 400 }
      );
    }

    await ensureSchema();

    const rows = await sql`
      INSERT INTO customers (company_id, name, email, phone, email_opt_in, sms_opt_in)
      VALUES (
        ${company.id}, ${name || null}, ${email || null}, ${phone || null},
        ${emailOptIn !== false}, ${!!smsOptIn}
      )
      RETURNING *
    `;

    return NextResponse.json({ customer: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong adding the customer.' }, { status: 500 });
  }
}
