import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function PUT(request, { params }) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { id } = await params;
    const { subject, emailBody, smsBody } = await request.json();

    if (!subject || !emailBody || !smsBody) {
      return NextResponse.json(
        { error: 'Subject, email body, and SMS body are all required.' },
        { status: 400 }
      );
    }

    await ensureSchema();

    const existing = await sql`
      SELECT id, status FROM campaigns WHERE id = ${id} AND company_id = ${company.id}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }
    if (existing[0].status === 'sent') {
      return NextResponse.json(
        { error: "This campaign has already been sent and can't be edited." },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE campaigns
      SET subject = ${subject}, email_body = ${emailBody}, sms_body = ${smsBody}
      WHERE id = ${id} AND company_id = ${company.id}
      RETURNING *
    `;

    return NextResponse.json({ campaign: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong saving your edits.' }, { status: 500 });
  }
}
