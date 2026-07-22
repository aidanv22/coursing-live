import { Resend } from 'resend';
import twilio from 'twilio';
import { sql } from './db';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function sendEmail({ to, subject, body, fromEmail, fromName }) {
  if (!resend) throw new Error('RESEND_API_KEY is not configured.');

  const from = fromEmail
    ? `${fromName || 'Coursing'} <${fromEmail}>`
    : process.env.RESEND_FROM_EMAIL || 'Coursing <onboarding@resend.dev>';

  await resend.emails.send({
    from,
    to,
    subject,
    text: body,
  });
}

async function sendSms({ to, body }) {
  if (!twilioClient) throw new Error('Twilio is not configured.');
  if (!process.env.TWILIO_FROM_NUMBER) throw new Error('TWILIO_FROM_NUMBER is not set.');

  await twilioClient.messages.create({
    to,
    from: process.env.TWILIO_FROM_NUMBER,
    body,
  });
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
      try {
        await sendSms({ to: customer.phone, body: campaign.sms_body });
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
