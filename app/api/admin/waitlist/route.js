import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD is not set on the server yet.' },
        { status: 500 }
      );
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const rows = await sql`
      SELECT company_name, email, team_size, created_at
      FROM waitlist
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: 'Something went wrong loading the waitlist.' },
      { status: 500 }
    );
  }
}
