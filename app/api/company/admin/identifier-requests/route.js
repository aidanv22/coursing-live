import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!company.is_platform_admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  await ensureSchema();

  const rows = await sql`
    SELECT
      r.id, r.requested_slug, r.requested_keyword, r.created_at,
      c.id AS company_id, c.name AS company_name, c.slug AS current_slug, c.join_keyword AS current_keyword
    FROM identifier_change_requests r
    JOIN companies c ON c.id = r.company_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC
  `;

  return NextResponse.json({ requests: rows });
}
