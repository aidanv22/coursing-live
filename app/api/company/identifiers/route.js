import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';
import { notifyAdmin } from '@/lib/senders';

// Must exactly match every word the SMS webhook (/api/sms/inbound) treats
// as a command — STOP/START/HELP/CONFIRM variants — so a company can never
// request a join keyword that would silently break their own opt-in flow.
const RESERVED_KEYWORDS = [
  'stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit',
  'start', 'unstop',
  'help', 'info',
  'y', 'yes', 'confirm',
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const KEYWORD_PATTERN = /^[A-Z0-9]+$/;

// Returns current slug/keyword plus any pending request for this company.
export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  await ensureSchema();
  const pending = await sql`
    SELECT id, requested_slug, requested_keyword, status, created_at
    FROM identifier_change_requests
    WHERE company_id = ${company.id} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return NextResponse.json({
    slug: company.slug,
    joinKeyword: company.join_keyword,
    pendingRequest: pending[0] || null,
  });
}

// Submits a change request — does NOT update the live slug/keyword.
export async function POST(request) {
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

    const existingPending = await sql`
      SELECT id FROM identifier_change_requests WHERE company_id = ${company.id} AND status = 'pending'
    `;
    if (existingPending.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending request. Cancel it first if you want to change your request.' },
        { status: 409 }
      );
    }

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
      INSERT INTO identifier_change_requests (company_id, requested_slug, requested_keyword)
      VALUES (${company.id}, ${cleanSlug}, ${cleanKeyword})
      RETURNING id, requested_slug, requested_keyword, status, created_at
    `;

    await notifyAdmin(
      'Coursing: sign-up link / keyword change request',
      `${company.name} (${company.email}) requested a change:\n\nCurrent sign-up link: ${company.slug}\nRequested sign-up link: ${cleanSlug}\n\nCurrent keyword: ${company.join_keyword}\nRequested keyword: ${cleanKeyword}\n\nReview and approve/deny in the admin dashboard. Remember: approving a keyword change means updating your Telnyx Toll-Free Verification request to match before the company starts using it.`
    );

    return NextResponse.json({ ok: true, request: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong submitting your request.' }, { status: 500 });
  }
}

// Cancels the company's own pending request.
export async function DELETE() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  await ensureSchema();
  await sql`
    UPDATE identifier_change_requests
    SET status = 'cancelled', resolved_at = NOW()
    WHERE company_id = ${company.id} AND status = 'pending'
  `;

  return NextResponse.json({ ok: true });
}
