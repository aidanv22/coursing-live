'use client';

import { useState } from 'react';

export default function JoinForm({ slug, companyName }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', emailOptIn: false, smsOptIn: false });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.emailOptIn && !form.smsOptIn) {
      setError('Please check at least one box below to sign up.');
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/public/opt-in/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <p style={{ fontSize: 15 }}>You're all set — thanks for signing up.</p>
        <p className="field-hint" style={{ marginTop: 8 }}>
          You can unsubscribe at any time using the link in any email, or by replying STOP to any
          text message.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="field">
        <label>Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+15551234567"
        />
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={form.emailOptIn}
            onChange={(e) => setForm((f) => ({ ...f, emailOptIn: e.target.checked }))}
            style={{ marginTop: 3 }}
          />
          <span>
            Yes, I'd like to receive marketing emails from {companyName || 'this business'} about
            new products, services, and promotions. Message frequency varies, typically up to one
            email per week and one per month.
          </span>
        </label>
      </div>

      <div className="field">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={form.smsOptIn}
            onChange={(e) => setForm((f) => ({ ...f, smsOptIn: e.target.checked }))}
            style={{ marginTop: 3 }}
          />
          <span>
            Yes, I'd like to receive text messages from {companyName || 'this business'} about new
            products, services, and promotions. Message frequency varies, typically up to one text
            per week and one per month. Message and data rates may apply. Reply HELP for help,
            STOP to cancel at any time.
          </span>
        </label>
      </div>

      <p className="field-hint" style={{ marginBottom: 4 }}>
        By providing your information and checking a box above, you agree to receive messages as
        described. Consent is not required to make a purchase.
      </p>
      <p className="field-hint" style={{ marginBottom: 16 }}>
        <a href="/terms">Terms of Service</a> · <a href="/privacy">Privacy Policy</a>
      </p>

      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-patina" type="submit" disabled={saving} style={{ width: '100%' }}>
        {saving ? 'Signing up…' : 'Yes, sign me up!'}
      </button>
    </form>
  );
}
