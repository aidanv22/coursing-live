import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Twilio's own carrier-level Advanced Opt-Out already blocks further sends
// after a STOP reply, independent of this code. This webhook exists so our
// own database (and the dashboard's opt-in checkboxes) stay in sync with
// what actually happened — otherwise the app would keep showing a customer
// as opted in even though Twilio is silently refusing to deliver to them.
function twiml(message) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${
      message ? `<Message>${message}</Message>` : ''
    }</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

const PENDING_TTL_MINUTES = 15;

export async function POST(request) {
  await ensureSchema();

  const formData = await request.formData();
  const from = formData.get('From');
  const bodyRaw = (formData.get('Body') || '').trim().toLowerCase();

  if (!from) return twiml();

  const STOP_WORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];
  const START_WORDS = ['start', 'unstop'];
  const HELP_WORDS = ['help', 'info'];
  const CONFIRM_WORDS = ['y', 'yes', 'confirm'];

  // STOP always takes priority, and applies globally for this phone number
  // across every business it's a customer of — matching how carriers treat
  // a STOP reply as a blanket opt-out for the sending number, not scoped to
  // a single conversation.
  if (STOP_WORDS.includes(bodyRaw)) {
    await sql`UPDATE customers SET sms_opt_in = FALSE WHERE phone = ${from}`;
    await sql`DELETE FROM pending_sms_optins WHERE phone = ${from}`;
    // Twilio automatically sends its own carrier-mandated STOP confirmation
    // reply, so we intentionally don't send a second message here.
    return twiml();
  }

  // Step 2 of keyword opt-in: if this phone number has a pending
  // confirmation waiting, "Y"/"YES"/"CONFIRM" completes it. Checked before
  // the general START handling below, since a fresh keyword opt-in is the
  // far more likely reason someone's replying "yes" than an unrelated
  // request to resume messages.
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

      return twiml(
        `You're all set! You're subscribed to updates from ${companyName}. Reply STOP anytime to unsubscribe.`
      );
    }
    // No pending confirmation found (expired or never started) — fall
    // through to general handling below, since a bare "yes" with nothing
    // pending isn't a recognized command on its own.
  }

  if (START_WORDS.includes(bodyRaw)) {
    await sql`UPDATE customers SET sms_opt_in = TRUE WHERE phone = ${from}`;
    return twiml('You are re-subscribed to text updates. Reply STOP at any time to opt out.');
  }

  if (HELP_WORDS.includes(bodyRaw)) {
    return twiml(
      "Coursing: We send marketing updates on behalf of local service businesses you've opted into. Reply STOP to unsubscribe."
    );
  }

  // Step 1 of keyword opt-in: texting a company's join keyword (e.g.
  // "STONEWORKS482") starts the opt-in process. We don't mark them as
  // opted in yet — that only happens after they reply Y to the disclosure
  // message below, matching Twilio's required two-step confirmation flow
  // for text-to-join campaigns.
  const keywordMatch = bodyRaw.toUpperCase();
  const companies = await sql`SELECT id, name FROM companies WHERE join_keyword = ${keywordMatch}`;
  const company = companies[0];

  if (company) {
    await sql`
      INSERT INTO pending_sms_optins (phone, company_id)
      VALUES (${from}, ${company.id})
      ON CONFLICT (phone) DO UPDATE SET company_id = EXCLUDED.company_id, created_at = NOW()
    `;

    return twiml(
      `Coursing: You'll get updates from ${company.name}. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel. Terms: www.coursingonline.com/terms Privacy: www.coursingonline.com/privacy. Reply Y to confirm.`
    );
  }

  return twiml();
}
