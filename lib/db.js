import { neon } from '@neondatabase/serverless';

// Neon's Vercel integration injects the connection string under
// DATABASE_URL (sometimes also POSTGRES_URL, depending on integration
// version) -- this checks both so it works either way.
export const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

let schemaReady = null;

// Idempotent — safe to call on every request. Creates every table the
// product needs if it doesn't already exist. Follows the same pattern as
// the original waitlist route so it stays consistent with how this repo
// already handles migrations (no separate migration step to run).
export async function ensureSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        team_size TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        website TEXT,
        phone TEXT,
        service_area TEXT,
        brand_voice TEXT,
        from_email TEXT,
        slug TEXT UNIQUE,
        join_keyword TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // ALTER TABLE ADD COLUMN IF NOT EXISTS is idempotent — safe to run every
    // request, and covers companies created before these columns existed.
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE`;
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS join_keyword TEXT UNIQUE`;
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS reset_token_version INTEGER DEFAULT 0`;
    await sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE`;

    // Tracks a phone number's in-progress SMS keyword opt-in while it's
    // waiting on the "Reply Y to confirm" step. One row per phone number —
    // texting a second keyword before confirming just overwrites which
    // company they're about to confirm into.
    await sql`
      CREATE TABLE IF NOT EXISTS pending_sms_optins (
        phone TEXT PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Companies can't change their sign-up slug or SMS join keyword
    // directly — since every company shares one Twilio number and one A2P
    // campaign registration, an unreviewed change would create a mismatch
    // between what's registered with the carrier and what the app actually
    // uses. Changes go through this request/approve queue instead.
    await sql`
      CREATE TABLE IF NOT EXISTS identifier_change_requests (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        requested_slug TEXT NOT NULL,
        requested_keyword TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT,
        email TEXT,
        phone TEXT,
        email_opt_in BOOLEAN DEFAULT TRUE,
        sms_opt_in BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        discount TEXT,
        starts_at DATE,
        ends_at DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        source_type TEXT,
        source_id INTEGER,
        subject TEXT,
        email_body TEXT,
        sms_body TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS campaign_sends (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  })();

  return schemaReady;
}
