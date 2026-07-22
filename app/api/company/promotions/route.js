import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`
    SELECT * FROM promotions WHERE company_id = ${company.id} ORDER BY created_at DESC
  `;
  return NextResponse.json({ promotions: rows });
}

export async function POST(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { title, description, discount, startsAt, endsAt } = await request.json();
    if (!title) return NextResponse.json({ error: 'Promotion title is required.' }, { status: 400 });

    await ensureSchema();

    const rows = await sql`
      INSERT INTO promotions (company_id, title, description, discount, starts_at, ends_at)
      VALUES (${company.id}, ${title}, ${description || null}, ${discount || null}, ${startsAt || null}, ${endsAt || null})
      RETURNING *
    `;

    return NextResponse.json({ promotion: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong adding the promotion.' }, { status: 500 });
  }
}
