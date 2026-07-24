'use client';

import { useState } from 'react';

export default function JoinForm({ slug }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', emailOptIn: false, smsOptIn: false });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={form.emailOptIn}
            onChange={(e) => setForm((f) => ({ ...f, emailOptIn: e.target.checked }))}
          />
          Email me updates
        </label>
      </div>
      <div className="field">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={form.smsOptIn}
            onChange={(e) => setForm((f) => ({ ...f, smsOptIn: e.target.checked }))}
          />
          Text me updates (message and data rates may apply, reply STOP to opt out)
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-patina" type="submit" disabled={saving} style={{ width: '100%' }}>
        {saving ? 'Signing up…' : 'Sign up'}
      </button>
    </form>
  );
}
