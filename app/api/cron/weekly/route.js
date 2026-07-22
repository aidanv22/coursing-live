import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { generateCampaignCopy } from '@/lib/ai';
import { dispatchCampaign } from '@/lib/senders';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured yet — allow (dev/testing)
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
    // Products that don't have a campaign yet.
    const newProducts = await sql`
      SELECT p.* FROM products p
      WHERE p.company_id = ${company.id}
      AND NOT EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.source_type = 'product' AND c.source_id = p.id
      )
      ORDER BY p.created_at ASC
    `;

    for (const product of newProducts) {
      try {
        const copy = await generateCampaignCopy({ company, type: 'weekly', item: product });

        const rows = await sql`
          INSERT INTO campaigns (company_id, type, source_type, source_id, subject, email_body, sms_body, status)
          VALUES (${company.id}, 'weekly', 'product', ${product.id}, ${copy.subject}, ${copy.email_body}, ${copy.sms_body}, 'draft')
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
          results.push({ company: company.name, product: product.name, ...summary });
        } else {
          results.push({ company: company.name, product: product.name, skipped: 'no customers yet' });
        }
      } catch (err) {
        results.push({ company: company.name, product: product.name, error: String(err.message || err) });
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
