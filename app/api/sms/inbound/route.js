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

export async function POST(request) {
  await ensureSchema();

  const formData = await request.formData();
  const from = formData.get('From');
  const bodyRaw = (formData.get('Body') || '').trim().toLowerCase();

  if (!from) return twiml();

  const STOP_WORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];
  const START_WORDS = ['start', 'yes', 'unstop'];
  const HELP_WORDS = ['help', 'info'];

  if (STOP_WORDS.includes(bodyRaw)) {
    await sql`UPDATE customers SET sms_opt_in = FALSE WHERE phone = ${from}`;
    // Twilio automatically sends its own carrier-mandated STOP confirmation
    // reply, so we intentionally don't send a second message here.
    return twiml();
  }

  if (START_WORDS.includes(bodyRaw)) {
    await sql`UPDATE customers SET sms_opt_in = TRUE WHERE phone = ${from}`;
    return twiml('You are re-subscribed to text updates. Reply STOP at any time to opt out.');
  }

  if (HELP_WORDS.includes(bodyRaw)) {
    return twiml(
      'Coursing: We send marketing updates on behalf of local service businesses you\'ve opted into. Reply STOP to unsubscribe.'
    );
  }

  // Keyword opt-in: texting a company's join keyword (e.g. "STONEWORKS123")
  // opts that phone number into SMS updates from that specific company.
  // Keywords are matched case-insensitively and must be an exact match (not
  // a substring) so STOP/START/HELP and ordinary conversational replies
  // never accidentally match.
  const keywordMatch = bodyRaw.toUpperCase();
  const companies = await sql`SELECT id, name FROM companies WHERE join_keyword = ${keywordMatch}`;
  const company = companies[0];

  if (company) {
    const existing = await sql`
      SELECT id FROM customers WHERE company_id = ${company.id} AND phone = ${from}
    `;

    if (existing.length > 0) {
      await sql`UPDATE customers SET sms_opt_in = TRUE WHERE id = ${existing[0].id}`;
    } else {
      await sql`
        INSERT INTO customers (company_id, phone, sms_opt_in, email_opt_in)
        VALUES (${company.id}, ${from}, TRUE, FALSE)
      `;
    }

    return twiml(
      `Coursing: You're now subscribed to updates from ${company.name}. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel.`
    );
  }

  return twiml();
}
