'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const [editingIdentifiers, setEditingIdentifiers] = useState(false);
  const [identifierForm, setIdentifierForm] = useState({ slug: '', joinKeyword: '' });
  const [pendingRequest, setPendingRequest] = useState(null);
  const [identifierError, setIdentifierError] = useState('');
  const [identifierSaving, setIdentifierSaving] = useState(false);

  async function loadIdentifiers() {
    const res = await fetch('/api/company/identifiers');
    const data = await res.json();
    if (res.ok) {
      setIdentifierForm({ slug: data.slug || '', joinKeyword: data.joinKeyword || '' });
      setPendingRequest(data.pendingRequest || null);
    }
  }

  useEffect(() => {
    fetch('/api/company/settings')
      .then((res) => res.json())
      .then((data) => setForm(data.company));
    loadIdentifiers();
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEditIdentifiers() {
    setIdentifierError('');
    setEditingIdentifiers(true);
  }

  function cancelEditIdentifiers() {
    setIdentifierForm({ slug: form.slug || '', joinKeyword: form.join_keyword || '' });
    setIdentifierError('');
    setEditingIdentifiers(false);
  }

  async function submitIdentifierRequest(e) {
    e.preventDefault();
    setIdentifierError('');
    setIdentifierSaving(true);
    const res = await fetch('/api/company/identifiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identifierForm),
    });
    const data = await res.json();
    setIdentifierSaving(false);
    if (!res.ok) {
      setIdentifierError(data.error || 'Something went wrong.');
      return;
    }
    setPendingRequest(data.request);
    setEditingIdentifiers(false);
  }

  async function cancelPendingRequest() {
    setIdentifierSaving(true);
    await fetch('/api/company/identifiers', { method: 'DELETE' });
    setIdentifierSaving(false);
    setPendingRequest(null);
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

        {pendingRequest ? (
          <>
            <div className="field">
              <label>Requested sign-up link</label>
              <input readOnly value={`.../join/${pendingRequest.requested_slug}`} />
            </div>
            <div className="field">
              <label>Requested keyword</label>
              <input readOnly value={pendingRequest.requested_keyword} />
            </div>
            <p className="field-hint" style={{ marginBottom: 12 }}>
              Submitted {new Date(pendingRequest.created_at).toLocaleDateString()} — waiting on
              approval. Your current link and keyword still work until this is approved.
            </p>
            <button className="btn btn-outline" onClick={cancelPendingRequest} disabled={identifierSaving}>
              {identifierSaving ? 'Cancelling…' : 'Cancel request'}
            </button>
          </>
        ) : editingIdentifiers ? (
          <form onSubmit={submitIdentifierRequest}>
            <div className="field">
              <label>Sign-up link (goes after coursingonline.com/join/)</label>
              <input
                value={identifierForm.slug}
                onChange={(e) =>
                  setIdentifierForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
                }
                placeholder="your-business-name"
              />
              <p className="field-hint">Lowercase letters, numbers, and hyphens only.</p>
            </div>
            <div className="field">
              <label>Text-to-join keyword</label>
              <input
                value={identifierForm.joinKeyword}
                onChange={(e) =>
                  setIdentifierForm((f) => ({ ...f, joinKeyword: e.target.value.toUpperCase() }))
                }
                placeholder="YOURBIZ123"
              />
              <p className="field-hint">Letters and numbers only, no spaces.</p>
            </div>
            <p className="field-hint" style={{ marginBottom: 12 }}>
              This doesn't change anything right away — it sends a request for approval, since
              keywords need to be registered with our SMS carrier before they'll work.
            </p>
            {identifierError && <p className="form-error">{identifierError}</p>}
            <button className="btn" style={{ marginRight: 8 }} type="submit" disabled={identifierSaving}>
              {identifierSaving ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={cancelEditIdentifiers}
              disabled={identifierSaving}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div className="field">
              <label>Sign-up link</label>
              <input
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/join/${identifierForm.slug}` : ''}
                onClick={(e) => e.target.select()}
              />
              <p className="field-hint">Share on your website, social media, or a QR code at your shop.</p>
            </div>
            <div className="field">
              <label>Text-to-join keyword</label>
              <input readOnly value={identifierForm.joinKeyword || ''} onClick={(e) => e.target.select()} />
              <p className="field-hint">
                Customers can text this word to your business's number to opt into text updates
                themselves — they'll get a disclosure message and reply Y to confirm.
              </p>
            </div>
            <button className="btn btn-outline" onClick={startEditIdentifiers}>
              Request a change
            </button>
          </>
        )}
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
