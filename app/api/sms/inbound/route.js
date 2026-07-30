import { NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import { sql, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PENDING_TTL_MINUTES = 15;

// Telnyx signs webhooks with Ed25519 (public-key signing, not HMAC like
// Twilio's X-Twilio-Signature). The signed message is `${timestamp}|${rawBody}`,
// and the signature + timestamp arrive as headers. Verify against your
// account's public key (Portal > Account Settings > Keys & Credentials >
// Public Key), stored in TELNYX_PUBLIC_KEY.
// Docs: https://support.telnyx.com/en/articles/4334722-how-to-leverage-webhooks
function verifyTelnyxSignature(rawBody, signatureHeader, timestampHeader) {
  const publicKeyB64 = process.env.TELNYX_PUBLIC_KEY;
  if (!publicKeyB64) {
    // Fail closed — refuse to process unverifiable webhooks rather than
    // silently skipping verification.
    throw new Error('TELNYX_PUBLIC_KEY is not configured; cannot verify webhook signature.');
  }
  if (!signatureHeader || !timestampHeader) return false;

  // Reject stale requests (replay protection) — 5 minute tolerance.
  const timestampSeconds = parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > 300) return false;

  const message = `${timestampHeader}|${rawBody}`;
  const signature = Buffer.from(signatureHeader, 'base64');
  const publicKey = Buffer.from(publicKeyB64, 'base64');
  const messageBytes = Buffer.from(message, 'utf8');

  return nacl.sign.detached.verify(messageBytes, signature, publicKey);
}

async function sendReply({ to, from, text }) {
  if (!process.env.TELNYX_API_KEY || !process.env.TELNYX_MESSAGING_PROFILE_ID) {
    // Not fatal — inbound processing (opt-in/opt-out state) still succeeds
    // even if we can't send a confirmation reply back.
    return;
  }
  try {
    await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        from,
        text,
        messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID,
      }),
    });
  } catch {
    // Swallowed intentionally — a failed reply shouldn't fail the webhook.
  }
}

export async function POST(request) {
  await ensureSchema();

  const rawBody = await request.text();

  let verified;
  try {
    verified = verifyTelnyxSignature(
      rawBody,
      request.headers.get('telnyx-signature-ed25519'),
      request.headers.get('telnyx-timestamp')
    );
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload?.data?.event_type;

  // Only inbound message events carry the fields this handler cares about.
  if (eventType !== 'message.received') {
    return NextResponse.json({ ok: true });
  }

  const msg = payload.data.payload;
  const from = msg?.from?.phone_number;
  const to = msg?.to?.[0]?.phone_number;
  const bodyRaw = (msg?.text || '').trim().toLowerCase();

  if (!from) return NextResponse.json({ ok: true });

  const STOP_WORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];
  const START_WORDS = ['start', 'unstop'];
  const HELP_WORDS = ['help', 'info'];
  const CONFIRM_WORDS = ['y', 'yes', 'confirm'];

  // Each company has its own dedicated number, so STOP/START/HELP only
  // apply to whichever specific business's number received this text — not
  // globally across every business the phone number happens to be a
  // customer of. Look up that company from the "To" number first.
  const toCompanyRows = to
    ? await sql`SELECT id, name FROM companies WHERE telnyx_phone_number = ${to}`
    : [];
  const toCompany = toCompanyRows[0] || null;

  if (STOP_WORDS.includes(bodyRaw)) {
    if (toCompany) {
      await sql`UPDATE customers SET sms_opt_in = FALSE WHERE phone = ${from} AND company_id = ${toCompany.id}`;
    } else {
      // Fallback for a number not yet assigned to a company row (shouldn't
      // normally happen once set up correctly) — opt out globally as a
      // safe default rather than doing nothing.
      await sql`UPDATE customers SET sms_opt_in = FALSE WHERE phone = ${from}`;
    }
    await sql`DELETE FROM pending_sms_optins WHERE phone = ${from}`;
    // Unlike Twilio, Telnyx does not automatically send a carrier-mandated
    // STOP confirmation reply on your behalf — send one explicitly so
    // customers still get the required opt-out acknowledgment.
    if (to) await sendReply({ to: from, from: to, text: 'You have been unsubscribed and will not receive any more messages. Reply START to resubscribe.' });
    return NextResponse.json({ ok: true });
  }

  if (CONFIRM_WORDS.includes(bodyRaw)) {
    const pending = await sql`
      SELECT p.company_id, c.name
      FROM pending_sms_optins p
      JOIN companies c ON c.id = p.company_id
      WHERE p.phone = ${from}
      AND p.created_at >= NOW() - (${PENDING_TTL_MINUTES} * INTERVAL '1 minute')
    `;

    if (pending.length > 0) {
      const { company_id: companyId, name: companyName } = pending[0];

      const existing = await sql`
        SELECT id FROM customers WHERE company_id = ${companyId} AND phone = ${from}
      `;
      if (existing.length > 0) {
        await sql`UPDATE customers SET sms_opt_in = TRUE WHERE id = ${existing[0].id}`;
      } else {
        await sql`
          INSERT INTO customers (company_id, phone, sms_opt_in, email_opt_in)
          VALUES (${companyId}, ${from}, TRUE, FALSE)
        `;
      }

      await sql`DELETE FROM pending_sms_optins WHERE phone = ${from}`;

      if (to) {
        await sendReply({
          to: from,
          from: to,
          text: `You're all set! You're subscribed to updates from ${companyName}. Reply STOP anytime to unsubscribe.`,
        });
      }
      return NextResponse.json({ ok: true });
    }
  }

  if (START_WORDS.includes(bodyRaw)) {
    if (toCompany) {
      await sql`UPDATE customers SET sms_opt_in = TRUE WHERE phone = ${from} AND company_id = ${toCompany.id}`;
    } else {
      await sql`UPDATE customers SET sms_opt_in = TRUE WHERE phone = ${from}`;
    }
    if (to) await sendReply({ to: from, from: to, text: 'You are re-subscribed to text updates. Reply STOP at any time to opt out.' });
    return NextResponse.json({ ok: true });
  }

  if (HELP_WORDS.includes(bodyRaw)) {
    if (to) {
      await sendReply({
        to: from,
        from: to,
        text: "Coursing: We send marketing updates on behalf of local service businesses you've opted into. Reply STOP to unsubscribe.",
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Keyword opt-in — unchanged, already scoped per-company via join_keyword.
  const keywordMatch = bodyRaw.toUpperCase();
  const companies = await sql`SELECT id, name FROM companies WHERE join_keyword = ${keywordMatch}`;
  const company = companies[0];

  if (company) {
    await sql`
      INSERT INTO pending_sms_optins (phone, company_id)
      VALUES (${from}, ${company.id})
      ON CONFLICT (phone) DO UPDATE SET company_id = EXCLUDED.company_id, created_at = NOW()
    `;

    if (to) {
      await sendReply({
        to: from,
        from: to,
        text: `Coursing: You'll get updates from ${company.name}. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel. Terms: www.coursingonline.com/terms Privacy: www.coursingonline.com/privacy. Reply Y to confirm.`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
