import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { sql, ensureSchema } from './db';
import { ensureCompanyIdentifiers } from './companyIdentifiers';

const SESSION_COOKIE = 'coursing_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const RESET_TTL_SECONDS = 60 * 60; // 1 hour

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set on the server.');
  }
  return secret;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Simple signed session token: base64(payload).signature
// Avoids pulling in a full JWT library for what is just "companyId + expiry".
function sign(payload) {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function unsign(token) {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(companyId) {
  const token = sign({ companyId, exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Returns the logged-in company's full row, or null.
export async function getCurrentCompany() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = unsign(token);
  if (!payload?.companyId) return null;

  await ensureSchema();
  const rows = await sql`SELECT * FROM companies WHERE id = ${payload.companyId}`;
  if (!rows[0]) return null;
  return ensureCompanyIdentifiers(rows[0]);
}

// Password reset tokens are short-lived (1 hour) and single-use. Single-use
// is enforced via a version counter stored on the company row: the token
// embeds the version that was current when it was issued, and resetting the
// password bumps the counter — so a reused or forwarded link stops working
// the moment the password is actually changed, without needing a separate
// tokens table.
export async function generatePasswordResetToken(companyId) {
  await ensureSchema();
  const rows = await sql`SELECT reset_token_version FROM companies WHERE id = ${companyId}`;
  const version = rows[0]?.reset_token_version ?? 0;
  return sign({
    companyId,
    version,
    purpose: 'password_reset',
    exp: Date.now() + RESET_TTL_SECONDS * 1000,
  });
}

export async function verifyPasswordResetToken(token) {
  const payload = unsign(token);
  if (!payload || payload.purpose !== 'password_reset' || !payload.companyId) return null;

  await ensureSchema();
  const rows = await sql`
    SELECT id, email, reset_token_version FROM companies WHERE id = ${payload.companyId}
  `;
  const company = rows[0];
  if (!company) return null;
  if ((company.reset_token_version ?? 0) !== payload.version) return null; // already used

  return company;
}

export async function consumePasswordResetToken(companyId, newPasswordHash) {
  await ensureSchema();
  await sql`
    UPDATE companies
    SET password_hash = ${newPasswordHash},
        reset_token_version = COALESCE(reset_token_version, 0) + 1
    WHERE id = ${companyId}
  `;
}
