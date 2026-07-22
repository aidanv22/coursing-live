import Link from 'next/link';
import { getCurrentCompany } from '@/lib/auth';
import { sql, ensureSchema } from '@/lib/db';

export default async function DashboardOverview() {
  const company = await getCurrentCompany();
  await ensureSchema();

  const [customerCount] = await sql`SELECT COUNT(*)::int AS count FROM customers WHERE company_id = ${company.id}`;
  const [productCount] = await sql`SELECT COUNT(*)::int AS count FROM products WHERE company_id = ${company.id}`;
  const [promoCount] = await sql`SELECT COUNT(*)::int AS count FROM promotions WHERE company_id = ${company.id}`;
  const [sentCount] = await sql`SELECT COUNT(*)::int AS count FROM campaigns WHERE company_id = ${company.id} AND status = 'sent'`;

  const hasBrandVoice = !!company.brand_voice;

  return (
    <>
      <div className="dash-page-head">
        <h1>Welcome back, {company.name}</h1>
      </div>
      <p className="dash-page-sub">
        Here's where things stand. Add products and promotions, and Coursing writes and sends the updates.
      </p>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{customerCount.count}</div>
          <div className="stat-label">Customers</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{productCount.count}</div>
          <div className="stat-label">Products/services</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{promoCount.count}</div>
          <div className="stat-label">Promotions</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{sentCount.count}</div>
          <div className="stat-label">Campaigns sent</div>
        </div>
      </div>

      {!hasBrandVoice && (
        <div className="dash-card">
          <h2>Set up your brand voice</h2>
          <p className="card-sub">
            Coursing uses this to write copy that sounds like you. Takes under a minute.
          </p>
          <Link href="/dashboard/settings" className="btn">
            Go to settings
          </Link>
        </div>
      )}

      <div className="dash-card">
        <h2>Quick start</h2>
        <p className="card-sub">The usual flow, in order:</p>
        <ol style={{ paddingLeft: 20, fontSize: 14.5, lineHeight: 2, color: '#4a473f' }}>
          <li>
            Add your <Link href="/dashboard/customers">customer list</Link> (or import a CSV)
          </li>
          <li>
            Add a <Link href="/dashboard/products">product or service</Link> — triggers a weekly update
          </li>
          <li>
            Add a <Link href="/dashboard/promotions">promotion</Link> — triggers a monthly sale update
          </li>
          <li>
            Review and send from <Link href="/dashboard/campaigns">Campaigns</Link>, or let the weekly/monthly
            automation handle it for you
          </li>
        </ol>
      </div>
    </>
  );
}
