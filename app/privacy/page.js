export const metadata = { title: 'Privacy Policy — Coursing' };

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', lineHeight: 1.7 }}>
      <h1 style={{ marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--stone-mid)', marginBottom: 32 }}>Last updated July 2026.</p>

      <h2>What Coursing is</h2>
      <p>
        Coursing is a marketing automation platform used by local service businesses (such as
        hardscaping and landscaping companies) to send email and text message updates to their own
        customers about new products, services, and promotions.
      </p>

      <h2>Information we collect</h2>
      <p>
        When a business signs up for Coursing, they enter contact information for their own
        customers — typically name, email address, and/or phone number — in order to send them
        marketing updates. Coursing also stores the business's own account information (company
        name, contact details, and the content of the messages generated on their behalf).
      </p>

      <h2>How mobile numbers are used</h2>
      <p>
        <strong>
          We do not sell, rent, or share mobile phone numbers or SMS opt-in data with third parties
          or affiliates for marketing or promotional purposes.
        </strong>{' '}
        Phone numbers collected through Coursing are used solely to deliver the text messages a
        business's own customers have agreed to receive from that business, and to allow customers
        to opt out (by replying STOP) or opt back in (by replying START).
      </p>

      <h2>Message frequency</h2>
      <p>
        Message frequency varies by business and depends on how often that business adds new
        products, services, or promotions. Typically, customers can expect to receive up to one
        message per week and one promotional message per month from a given business, though actual
        frequency may be more or less depending on that business's activity.
      </p>

      <h2>Message and data rates</h2>
      <p>Message and data rates may apply. Message frequency varies. Reply STOP to opt out of text messages at any time, or START to opt back in. Reply HELP for help.</p>

      <h2>How to opt out</h2>
      <p>
        Recipients can unsubscribe from text messages at any time by replying STOP to any message.
        Recipients can unsubscribe from emails using the unsubscribe link included at the bottom of
        every email.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        Customer contact information is retained for as long as the business maintains an active
        Coursing account, or until the individual is removed by that business, or until the
        individual opts out. If you're an end customer of one of our business users and want your
        information removed entirely rather than just opted out, contact the business directly.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to the contact address listed on our homepage.</p>
    </div>
  );
}
