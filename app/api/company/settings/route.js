import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const { password_hash, ...safe } = company;
  return NextResponse.json({ company: safe });
}

export async function PUT(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { name, website, phone, serviceArea, brandVoice, fromEmail } = await request.json();
    await ensureSchema();

    await sql`
      UPDATE companies
      SET name = ${name || company.name},
          website = ${website ?? company.website},
          phone = ${phone ?? company.phone},
          service_area = ${serviceArea ?? company.service_area},
          brand_voice = ${brandVoice ?? company.brand_voice},
          from_email = ${fromEmail ?? company.from_email}
      WHERE id = ${company.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong saving settings.' }, { status: 500 });
  }
}
