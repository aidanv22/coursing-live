import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Neon's Vercel integration injects the connection string under
// DATABASE_URL (sometimes also POSTGRES_URL, depending on integration
// version) -- this checks both so it works either way.
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      team_size TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT COUNT(*)::int AS count FROM waitlist`;
    return NextResponse.json({ count: rows[0].count });
  } catch (err) {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(request) {
  try {
    const { companyName, email, teamSize } = await request.json();

    if (!companyName || !email) {
      return NextResponse.json(
        { error: 'Company name and email are required.' },
        { status: 400 }
      );
    }

    await ensureTable();

    await sql`
      INSERT INTO waitlist (company_name, email, team_size)
      VALUES (${companyName}, ${email.toLowerCase()}, ${teamSize || null})
      ON CONFLICT (email)
      DO UPDATE SET company_name = EXCLUDED.company_name, team_size = EXCLUDED.team_size
    `;

    const rows = await sql`SELECT COUNT(*)::int AS count FROM waitlist`;

    return NextResponse.json({ ok: true, count: rows[0].count });
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
