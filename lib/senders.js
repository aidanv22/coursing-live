import { Resend } from 'resend';
import twilio from 'twilio';
import { sql } from './db';
import { generateUnsubscribeToken } from './unsubscribe';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

function appUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

function unsubscribeLink(customerId, channel) {
  const token = generateUnsubscribeToken(customerId, channel);
  return `${appUrl()}/api/unsubscribe?token=${token}`;
}

async function sendEmail({ to, subject, body, fromEmail, fromName, customerId }) {
  if (!resend) throw new Error('RESEND_API_KEY is not configured.');

  const from = fromEmail
    ? `${fromName || 'Coursing'} <${fromEmail}>`
    : process.env.RESEND_FROM_EMAIL || 'Coursing <onboarding@resend.dev>';

  const link = unsubscribeLink(customerId, 'email');
  const fullBody = `${body}\n\n---\nDon't want these emails? Unsubscribe: ${link}`;

  await resend.emails.send({
    from,
    to,
    subject,
    text: fullBody,
  });
}

async function sendSms({ to, body, fromNumber }) {
  if (!twilioClient) throw new Error('Twilio is not configured.');

  // Safety net: if the AI-generated copy didn't already include opt-out
  // language, append it. Carriers require this on every marketing message,
  // and Twilio's own STOP handling (see /api/sms/inbound) is the mechanism
  // that actually processes it when a customer replies.
  const hasStopLanguage = /\bstop\b/i.test(body);
  const fullBody = hasStopLanguage ? body : `${body} Reply STOP to opt out.`;

  await twilioClient.messages.create({
    to,
    from: fromNumber,
    body: fullBody,
  });
}

// For transactional emails (password resets, etc) — not a marketing send,
// so no unsubscribe footer and no campaign_sends logging.
export async function sendTransactionalEmail({ to, subject, body }) {
  if (!resend) throw new Error('RESEND_API_KEY is not configured.');
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Coursing <onboarding@resend.dev>',
    to,
    subject,
    text: body,
  });
}

// Notifies you (the platform owner) when something noteworthy happens —
// a new waitlist signup or a new company account. Silently no-ops if
// ADMIN_NOTIFY_EMAIL isn't set or the send fails, so a notification issue
// never blocks the actual signup/waitlist flow for the end user.
export async function notifyAdmin(subject, body) {
  if (!process.env.ADMIN_NOTIFY_EMAIL) return;
  try {
    await sendTransactionalEmail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject, body });
  } catch {
    // Intentionally swallowed — a failed notification shouldn't fail the
    // signup/waitlist request itself.
  }
}

// Sends a campaign to every opted-in customer for the company, logging each
// attempt to campaign_sends. Returns a summary of what happened.
export async function dispatchCampaign({ campaign, company, customers }) {
  let emailsSent = 0;
  let smsSent = 0;
  let failures = 0;

  for (const customer of customers) {
    if (customer.email_opt_in && customer.email) {
      try {
        await sendEmail({
          to: customer.email,
          subject: campaign.subject,
          body: campaign.email_body,
          fromEmail: company.from_email,
          fromName: company.name,
          customerId: customer.id,
        });
        await sql`
          INSERT INTO campaign_sends (campaign_id, customer_id, channel, status)
          VALUES (${campaign.id}, ${customer.id}, 'email', 'sent')
        `;
        emailsSent++;
      } catch (err) {
        failures++;
        await sql`
          INSERT INTO campaign_sends (campaign_id, customer_id, channel, status, error)
          VALUES (${campaign.id}, ${customer.id}, 'email', 'failed', ${String(err.message || err)})
        `;
      }
    }

    if (customer.sms_opt_in && customer.phone) {
      if (!company.twilio_phone_number) {
        // Not an error — this company just hasn't been assigned a verified
        // number yet (pending ISV/Secondary Profile approval). Skip
        // silently rather than logging a failure; email still goes out.
        continue;
      }
      try {
        await sendSms({ to: customer.phone, body: campaign.sms_body, fromNumber: company.twilio_phone_number });
        await sql`
          INSERT INTO campaign_sends (campaign_id, customer_id, channel, status)
          VALUES (${campaign.id}, ${customer.id}, 'sms', 'sent')
        `;
        smsSent++;
      } catch (err) {
        failures++;
        await sql`
          INSERT INTO campaign_sends (campaign_id, customer_id, channel, status, error)
          VALUES (${campaign.id}, ${customer.id}, 'sms', 'failed', ${String(err.message || err)})
        `;
      }
    }
  }

  return { emailsSent, smsSent, failures };
}
