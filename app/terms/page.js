export const metadata = { title: 'Terms of Service — Coursing' };

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', lineHeight: 1.7 }}>
      <h1 style={{ marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: 'var(--stone-mid)', marginBottom: 32 }}>Last updated July 2026.</p>

      <h2>Using Coursing</h2>
      <p>
        Coursing is a marketing automation tool for local service businesses. By creating an
        account, you agree to use it only to send messages to your own customers who have consented
        to receive marketing communications from your business.
      </p>

      <h2>Consent is your responsibility</h2>
      <p>
        You are responsible for obtaining proper consent from anyone you add as a customer in
        Coursing before sending them marketing emails or text messages, and for complying with
        applicable laws, including the CAN-SPAM Act and the Telephone Consumer Protection Act
        (TCPA). Coursing provides the tools to send messages and to process opt-outs, but the
        underlying consent to contact each individual customer must come from you.
      </p>

      <h2>Message content</h2>
      <p>
        Messages sent through Coursing are generated with AI assistance based on the information you
        provide about your business and your products, services, or promotions. You're responsible
        for reviewing generated content before sending and for its accuracy.
      </p>

      <h2>Opt-outs</h2>
      <p>
        Coursing automatically processes STOP/START text message replies and provides an
        unsubscribe link on every email. You may not attempt to re-contact someone who has opted out
        through channels outside of Coursing without separately re-obtaining their consent.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may not use Coursing to send unsolicited messages to people who haven't agreed to
        receive them, to send spam, or to send content unrelated to your own legitimate business
        marketing.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated from time to time. Continued use of Coursing after changes take effect constitutes acceptance of the updated terms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to the contact address listed on our homepage.</p>
    </div>
  );
}
