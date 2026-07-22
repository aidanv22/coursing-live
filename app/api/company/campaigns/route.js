import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`
    SELECT * FROM campaigns WHERE company_id = ${company.id} ORDER BY created_at DESC
  `;
  return NextResponse.json({ campaigns: rows });
}
