import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  await sql`DELETE FROM customers WHERE id = ${id} AND company_id = ${company.id}`;
  return NextResponse.json({ ok: true });
}
