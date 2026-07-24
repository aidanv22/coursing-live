import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { getCurrentCompany } from '@/lib/auth';

export async function POST(request, { params }) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!company.is_platform_admin) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    await ensureSchema();

    const rows = await sql`
      SELECT * FROM identifier_change_requests WHERE id = ${id} AND status = 'pending'
    `;
    const req = rows[0];
    if (!req) {
      return NextResponse.json({ error: 'Request not found or already resolved.' }, { status: 404 });
    }

    if (action === 'deny') {
      await sql`
        UPDATE identifier_change_requests SET status = 'denied', resolved_at = NOW() WHERE id = ${id}
      `;
      return NextResponse.json({ ok: true, action: 'denied' });
    }

    // Re-check for collisions at approval time — the slug/keyword could
    // have been taken by someone else since the request was submitted.
    const slugTaken = await sql`
      SELECT id FROM companies WHERE slug = ${req.requested_slug} AND id != ${req.company_id}
    `;
    if (slugTaken.length > 0) {
      return NextResponse.json(
        { error: 'That sign-up link has since been taken by another company. Deny this request and ask them to resubmit.' },
        { status: 409 }
      );
    }
    const keywordTaken = await sql`
      SELECT id FROM companies WHERE join_keyword = ${req.requested_keyword} AND id != ${req.company_id}
    `;
    if (keywordTaken.length > 0) {
      return NextResponse.json(
        { error: 'That keyword has since been taken by another company. Deny this request and ask them to resubmit.' },
        { status: 409 }
      );
    }

    await sql`
      UPDATE companies SET slug = ${req.requested_slug}, join_keyword = ${req.requested_keyword}
      WHERE id = ${req.company_id}
    `;
    await sql`
      UPDATE identifier_change_requests SET status = 'approved', resolved_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({ ok: true, action: 'approved' });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
