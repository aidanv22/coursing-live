import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';
import { generateCampaignCopy } from '@/lib/ai';

export async function POST(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { type, sourceId } = await request.json();

    if (!['weekly', 'monthly'].includes(type)) {
      return NextResponse.json({ error: 'type must be "weekly" or "monthly".' }, { status: 400 });
    }
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required.' }, { status: 400 });
    }

    await ensureSchema();

    const sourceType = type === 'weekly' ? 'product' : 'promotion';

    const sourceRows =
      type === 'weekly'
        ? await sql`SELECT * FROM products WHERE id = ${sourceId} AND company_id = ${company.id}`
        : await sql`SELECT * FROM promotions WHERE id = ${sourceId} AND company_id = ${company.id}`;
    const item = sourceRows[0];
    if (!item) {
      return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    }

    const copy = await generateCampaignCopy({ company, type, item });

    const rows = await sql`
      INSERT INTO campaigns (company_id, type, source_type, source_id, subject, email_body, sms_body, status)
      VALUES (${company.id}, ${type}, ${sourceType}, ${sourceId}, ${copy.subject}, ${copy.email_body}, ${copy.sms_body}, 'draft')
      RETURNING *
    `;

    return NextResponse.json({ campaign: rows[0] });
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong generating the campaign. ' + (err.message || '') },
      { status: 500 }
    );
  }
}
