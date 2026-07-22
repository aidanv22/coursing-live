import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { generateCampaignCopy } from '@/lib/ai';
import { dispatchCampaign } from '@/lib/senders';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  await ensureSchema();

  const companies = await sql`SELECT * FROM companies`;
  const results = [];

  for (const company of companies) {
    // Active promotions (not expired) that don't have a campaign yet.
    const newPromotions = await sql`
      SELECT pr.* FROM promotions pr
      WHERE pr.company_id = ${company.id}
      AND (pr.ends_at IS NULL OR pr.ends_at >= CURRENT_DATE)
      AND NOT EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.source_type = 'promotion' AND c.source_id = pr.id
      )
      ORDER BY pr.created_at ASC
    `;

    for (const promo of newPromotions) {
      try {
        const copy = await generateCampaignCopy({ company, type: 'monthly', item: promo });

        const rows = await sql`
          INSERT INTO campaigns (company_id, type, source_type, source_id, subject, email_body, sms_body, status)
          VALUES (${company.id}, 'monthly', 'promotion', ${promo.id}, ${copy.subject}, ${copy.email_body}, ${copy.sms_body}, 'draft')
          RETURNING *
        `;
        const campaign = rows[0];

        const customers = await sql`
          SELECT * FROM customers
          WHERE company_id = ${company.id} AND (email_opt_in = TRUE OR sms_opt_in = TRUE)
        `;

        if (customers.length > 0) {
          const summary = await dispatchCampaign({ campaign, company, customers });
          await sql`UPDATE campaigns SET status = 'sent', sent_at = NOW() WHERE id = ${campaign.id}`;
          results.push({ company: company.name, promotion: promo.title, ...summary });
        } else {
          results.push({ company: company.name, promotion: promo.title, skipped: 'no customers yet' });
        }
      } catch (err) {
        results.push({ company: company.name, promotion: promo.title, error: String(err.message || err) });
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
