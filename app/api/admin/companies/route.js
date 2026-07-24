import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD is not set on the server yet.' },
        { status: 500 }
      );
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    await ensureSchema();

    const rows = await sql`
      SELECT
        c.id,
        c.name,
        c.email,
        c.service_area,
        c.created_at,
        (SELECT COUNT(*)::int FROM customers cu WHERE cu.company_id = c.id) AS customer_count,
        (SELECT COUNT(*)::int FROM customers cu WHERE cu.company_id = c.id AND cu.email_opt_in) AS email_opt_in_count,
        (SELECT COUNT(*)::int FROM customers cu WHERE cu.company_id = c.id AND cu.sms_opt_in) AS sms_opt_in_count,
        (SELECT COUNT(*)::int FROM products p WHERE p.company_id = c.id) AS product_count,
        (SELECT COUNT(*)::int FROM promotions pr WHERE pr.company_id = c.id) AS promotion_count,
        (SELECT COUNT(*)::int FROM campaigns ca WHERE ca.company_id = c.id AND ca.status = 'sent') AS campaigns_sent_count,
        (
          SELECT COUNT(*)::int FROM campaign_sends cs
          JOIN campaigns ca2 ON cs.campaign_id = ca2.id
          WHERE ca2.company_id = c.id AND cs.status = 'sent' AND cs.channel = 'email'
          AND cs.sent_at >= date_trunc('month', NOW())
        ) AS emails_this_month,
        (
          SELECT COUNT(*)::int FROM campaign_sends cs
          JOIN campaigns ca3 ON cs.campaign_id = ca3.id
          WHERE ca3.company_id = c.id AND cs.status = 'sent' AND cs.channel = 'sms'
          AND cs.sent_at >= date_trunc('month', NOW())
        ) AS sms_this_month
      FROM companies c
      ORDER BY c.created_at DESC
    `;

    const totals = rows.reduce(
      (acc, r) => ({
        customers: acc.customers + r.customer_count,
        emailsThisMonth: acc.emailsThisMonth + r.emails_this_month,
        smsThisMonth: acc.smsThisMonth + r.sms_this_month,
      }),
      { customers: 0, emailsThisMonth: 0, smsThisMonth: 0 }
    );

    return NextResponse.json({ companies: rows, totals });
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong loading companies.' },
      { status: 500 }
    );
  }
}
