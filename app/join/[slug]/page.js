import { sql, ensureSchema } from '@/lib/db';
import JoinForm from './JoinForm';

export const dynamic = 'force-dynamic';

export default async function JoinPage({ params }) {
  const { slug } = await params;
  await ensureSchema();

  const rows = await sql`SELECT id, name, slug FROM companies WHERE slug = ${slug}`;
  const company = rows[0];

  if (!company) {
    // TEMPORARY DEBUG — remove once the slug lookup mismatch is diagnosed.
    const debugInfo = {
      receivedSlug: slug,
      receivedSlugLength: slug ? slug.length : null,
      receivedSlugCharCodes: slug ? Array.from(slug).map((c) => c.charCodeAt(0)) : null,
    };
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Link not found</h1>
          <p className="sub">This sign-up link isn't valid. Double check the link and try again.</p>
          <pre style={{ textAlign: 'left', fontSize: 11, background: '#f4f0e6', padding: 12, marginTop: 20, overflowX: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
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
