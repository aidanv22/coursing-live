import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

// Accepts { csv: "name,email,phone\nJane Doe,jane@x.com,+15551234567\n..." }
// Header row is optional and auto-detected. Skips blank lines.
export async function POST(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { csv } = await request.json();
    if (!csv || !csv.trim()) {
      return NextResponse.json({ error: 'No CSV data provided.' }, { status: 400 });
    }

    await ensureSchema();

    const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
    let startIndex = 0;
    if (/name|email|phone/i.test(lines[0])) startIndex = 1;

    let imported = 0;
    let skipped = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const [name, email, phone] = parts;

      if (!email && !phone) {
        skipped++;
        continue;
      }

      await sql`
        INSERT INTO customers (company_id, name, email, phone, email_opt_in, sms_opt_in)
        VALUES (${company.id}, ${name || null}, ${email || null}, ${phone || null}, ${!!email}, ${!!phone})
      `;
      imported++;
    }

    return NextResponse.json({ ok: true, imported, skipped });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong importing customers.' }, { status: 500 });
  }
}
