import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

// Must exactly match every word the SMS webhook (/api/sms/inbound) treats
// as a command — STOP/START/HELP/CONFIRM variants — so a company can never
// set their own join keyword to something that would silently break their
// own opt-in flow.
const RESERVED_KEYWORDS = [
  'stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit',
  'start', 'unstop',
  'help', 'info',
  'y', 'yes', 'confirm',
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const KEYWORD_PATTERN = /^[A-Z0-9]+$/;

export async function PUT(request) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  try {
    const { slug, joinKeyword } = await request.json();

    const cleanSlug = (slug || '').trim().toLowerCase();
    const cleanKeyword = (joinKeyword || '').trim().toUpperCase();

    if (cleanSlug.length < 3 || cleanSlug.length > 50) {
      return NextResponse.json(
        { error: 'Sign-up link must be between 3 and 50 characters.' },
        { status: 400 }
      );
    }
    if (!SLUG_PATTERN.test(cleanSlug)) {
      return NextResponse.json(
        { error: 'Sign-up link can only contain lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    if (cleanKeyword.length < 3 || cleanKeyword.length > 20) {
      return NextResponse.json(
        { error: 'Keyword must be between 3 and 20 characters.' },
        { status: 400 }
      );
    }
    if (!KEYWORD_PATTERN.test(cleanKeyword)) {
      return NextResponse.json(
        { error: 'Keyword can only contain letters and numbers, no spaces or symbols.' },
        { status: 400 }
      );
    }
    if (RESERVED_KEYWORDS.includes(cleanKeyword.toLowerCase())) {
      return NextResponse.json(
        {
          error: `"${cleanKeyword}" is reserved for STOP/START/HELP handling and can't be used as a join keyword.`,
        },
        { status: 400 }
      );
    }

    await ensureSchema();

    const slugTaken = await sql`
      SELECT id FROM companies WHERE slug = ${cleanSlug} AND id != ${company.id}
    `;
    if (slugTaken.length > 0) {
      return NextResponse.json(
        { error: 'That sign-up link is already taken. Try a different one.' },
        { status: 409 }
      );
    }

    const keywordTaken = await sql`
      SELECT id FROM companies WHERE join_keyword = ${cleanKeyword} AND id != ${company.id}
    `;
    if (keywordTaken.length > 0) {
      return NextResponse.json(
        { error: 'That keyword is already taken. Try a different one.' },
        { status: 409 }
      );
    }

    const rows = await sql`
      UPDATE companies SET slug = ${cleanSlug}, join_keyword = ${cleanKeyword}
      WHERE id = ${company.id}
      RETURNING slug, join_keyword
    `;

    return NextResponse.json({ ok: true, ...rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong saving your changes.' }, { status: 500 });
  }
}
