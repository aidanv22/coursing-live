import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';
import { dispatchCampaign } from '@/lib/senders';

export async function POST(request, { params }) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { id } = await params;
    await ensureSchema();

    const rows = await sql`SELECT * FROM campaigns WHERE id = ${id} AND company_id = ${company.id}`;
    const campaign = rows[0];
    if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'This campaign has already been sent.' }, { status: 400 });
    }

    const customers = await sql`
      SELECT * FROM customers
      WHERE company_id = ${company.id} AND (email_opt_in = TRUE OR sms_opt_in = TRUE)
    `;

    if (customers.length === 0) {
      return NextResponse.json(
        { error: 'No opted-in customers to send to yet. Add customers first.' },
        { status: 400 }
      );
    }

    const summary = await dispatchCampaign({ campaign, company, customers });

    await sql`UPDATE campaigns SET status = 'sent', sent_at = NOW() WHERE id = ${campaign.id}`;

    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong sending the campaign. ' + (err.message || '') },
      { status: 500 }
    );
  }
}
