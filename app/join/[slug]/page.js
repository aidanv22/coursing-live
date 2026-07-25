import { sql, ensureSchema } from '@/lib/db';
import JoinForm from './JoinForm';

export const dynamic = 'force-dynamic';

export default async function JoinPage({ params }) {
  const { slug } = await params;
  await ensureSchema();

  const rows = await sql`SELECT id, name, slug FROM companies WHERE slug = ${slug}`;
  const company = rows[0];

  if (!company) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Link not found</h1>
          <p className="sub">This sign-up link isn't valid. Double check the link and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Stay updated by {company.name}</h1>
        <p className="sub">
          Get occasional updates about new products, services, and promotions. Unsubscribe anytime.
        </p>
        <JoinForm slug={slug} companyName={company.name} />
      </div>
    </div>
  );
}
