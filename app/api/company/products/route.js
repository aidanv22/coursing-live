import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`
    SELECT * FROM products WHERE company_id = ${company.id} ORDER BY created_at DESC
  `;
  return NextResponse.json({ products: rows });
}

export async function POST(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { name, description, price } = await request.json();
    if (!name) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });

    await ensureSchema();

    const rows = await sql`
      INSERT INTO products (company_id, name, description, price)
      VALUES (${company.id}, ${name}, ${description || null}, ${price || null})
      RETURNING *
    `;

    return NextResponse.json({ product: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong adding the product.' }, { status: 500 });
  }
}
