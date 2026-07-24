'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/company/settings')
      .then((res) => res.json())
      .then((data) => setForm(data.company));
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    const res = await fetch('/api/company/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        website: form.website,
        phone: form.phone,
        serviceArea: form.service_area,
        brandVoice: form.brand_voice,
        fromEmail: form.from_email,
      }),
    });
    setSaving(false);
    setStatus(res.ok ? 'Saved.' : 'Something went wrong saving.');
  }

  if (!form) return <p className="empty-state">Loading…</p>;

  return (
    <>
      <div className="dash-page-head">
        <h1>Business Information</h1>
      </div>
      <p className="dash-page-sub">Business info and brand voice used to write your campaigns.</p>

      <div className="dash-card">
        <h2>How customers opt in</h2>
        <p className="card-sub">
          Share either of these with your customers so they can sign themselves up, instead of you
          entering them by hand every time.
        </p>
        <div className="field">
          <label>Sign-up link</label>
          <input
            readOnly
            value={typeof window !== 'undefined' ? `${window.location.origin}/join/${form.slug}` : ''}
            onClick={(e) => e.target.select()}
          />
          <p className="field-hint">Share on your website, social media, or a QR code at your shop.</p>
        </div>
        <div className="field">
          <label>Text-to-join keyword</label>
          <input readOnly value={form.join_keyword || ''} onClick={(e) => e.target.select()} />
          <p className="field-hint">
            Customers can text this word to your business's number to opt into text updates
            themselves — they'll get a disclosure message and reply Y to confirm.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="dash-card">
          <h2>Business info</h2>
          <div className="field">
            <label>Company name</label>
            <input value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="dash-row">
            <div className="field">
              <label>Website</label>
              <input value={form.website || ''} onChange={(e) => update('website', e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Service area</label>
            <input
              value={form.service_area || ''}
              onChange={(e) => update('service_area', e.target.value)}
              placeholder="Charlotte metro & Lake Norman"
            />
          </div>
        </div>

        <div className="dash-card">
          <h2>Brand voice</h2>
          <p className="card-sub">
            Describe how your marketing should sound — tone, personality, anything to avoid. This gets fed
            directly to the AI that writes your campaigns.
          </p>
          <div className="field">
            <textarea
              value={form.brand_voice || ''}
              onChange={(e) => update('brand_voice', e.target.value)}
              placeholder="Friendly and down-to-earth, not salesy. We're proud of our craftsmanship but keep things approachable. Avoid corporate jargon."
              rows={4}
            />
          </div>
        </div>

        <div className="dash-card">
          <h2>Sending email address</h2>
          <p className="card-sub">
            The "from" address customers see on your emails. Leave blank to use the Coursing default while
            you're getting set up.
          </p>
          <div className="field">
            <input
              value={form.from_email || ''}
              onChange={(e) => update('from_email', e.target.value)}
              placeholder="hello@yourcompany.com"
            />
            <p className="field-hint">
              Custom sending domains need to be verified with our email provider first — ask if you want
              this set up.
            </p>
          </div>
        </div>

        {status && <p className="field-hint" style={{ marginBottom: 12 }}>{status}</p>}
        <button className="btn btn-patina" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </>
  );
}
