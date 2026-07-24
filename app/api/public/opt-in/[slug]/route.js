import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const { name, email, phone, emailOptIn, smsOptIn } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Please provide at least an email or a phone number.' },
        { status: 400 }
      );
    }
    if (!emailOptIn && !smsOptIn) {
      return NextResponse.json(
        { error: 'Please select at least one way to hear from us.' },
        { status: 400 }
      );
    }

    await ensureSchema();

    const companies = await sql`SELECT id FROM companies WHERE slug = ${slug}`;
    const company = companies[0];
    if (!company) {
      return NextResponse.json({ error: 'This sign-up link is no longer valid.' }, { status: 404 });
    }

    // If this email or phone already exists for this company, update their
    // preferences rather than creating a duplicate customer record.
    let existing = [];
    if (email) {
      existing = await sql`
        SELECT id FROM customers WHERE company_id = ${company.id} AND email = ${email}
      `;
    }
    if (existing.length === 0 && phone) {
      existing = await sql`
        SELECT id FROM customers WHERE company_id = ${company.id} AND phone = ${phone}
      `;
    }

    if (existing.length > 0) {
      await sql`
        UPDATE customers
        SET name = COALESCE(${name || null}, name),
            email = COALESCE(${email || null}, email),
            phone = COALESCE(${phone || null}, phone),
            email_opt_in = ${!!emailOptIn},
            sms_opt_in = ${!!smsOptIn}
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO customers (company_id, name, email, phone, email_opt_in, sms_opt_in)
        VALUES (${company.id}, ${name || null}, ${email || null}, ${phone || null}, ${!!emailOptIn}, ${!!smsOptIn})
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
