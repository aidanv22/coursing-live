import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// TEMPORARY — for diagnosing the /join/[slug] 404 issue. Delete this route
// once the underlying cause is confirmed and fixed.
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  // Mask the password/host for safety in the response, keep enough to
  // identify which database/branch this is.
  const hostMatch = dbUrl.match(/@([^/]+)\//);
  const dbHost = hostMatch ? hostMatch[1] : 'unknown';

  let rows = [];
  let error = null;
  let exactMatchTest = null;
  try {
    rows = await sql`SELECT id, name, slug, length(slug) as slug_length FROM companies ORDER BY id`;
    // Replicate the *exact* query app/join/[slug]/page.js runs, with the
    // exact slug string, to rule out any difference between this
    // unfiltered SELECT and the actual parameterized lookup the join page
    // performs.
    const testSlug = 'ultimate-stone-solutions';
    const matchRows = await sql`SELECT id, name, slug FROM companies WHERE slug = ${testSlug}`;
    exactMatchTest = { testSlug, matchCount: matchRows.length, matchRows };
  } catch (err) {
    error = String(err.message || err);
  }

  return NextResponse.json({
    dbHost,
    error,
    companies: rows,
    exactMatchTest,
  });
}
