'use client';

import { useEffect, useState } from 'react';

const USE_CASE_OPTIONS = [
  '2FA', 'App Notifications', 'Appointments', 'Booking Confirmations', 'Business Updates',
  'Customer Care', 'Delivery Notifications', 'Financial Services', 'Fraud Alerts',
  'General Marketing', 'Job Dispatch', 'Order Notifications', 'Real Estate Services',
  'Rewards Program', 'Surveys', 'Mixed',
];

const BLANK_FORM = {
  businessName: '',
  corporateWebsite: '',
  businessContactFirstName: '',
  businessContactLastName: '',
  businessContactEmail: '',
  businessContactPhone: '',
  businessAddr1: '',
  businessAddr2: '',
  businessCity: '',
  businessState: '',
  businessZip: '',
  businessRegistrationNumber: '',
  businessRegistrationType: 'EIN',
  businessRegistrationCountry: 'US',
  entityType: 'SOLE_PROPRIETORSHIP',
  useCase: 'General Marketing',
  useCaseSummary: '',
  productionMessageContent: '',
  optInWorkflow: '',
  optInWorkflowImageURLs: '',
  messageVolume: '',
  phoneNumbers: '',
  isvReseller: '',
  additionalInformation: '',
};

function toApiPayload(form) {
  return {
    ...form,
    phoneNumbers: form.phoneNumbers
      ? form.phoneNumbers.split(',').map((s) => ({ phoneNumber: s.trim() })).filter((p) => p.phoneNumber)
      : [],
    optInWorkflowImageURLs: form.optInWorkflowImageURLs
      ? form.optInWorkflowImageURLs.split(',').map((s) => ({ url: s.trim() })).filter((u) => u.url)
      : [],
  };
}

export default function TollFreeView() {
  const [verifications, setVerifications] = useState(null);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formStatus, setFormStatus] = useState('');

  const [deleting, setDeleting] = useState(null);

  async function load() {
    const res = await fetch('/api/company/admin/toll-free');
    const data = await res.json();
    if (res.ok) setVerifications(data.verifications);
    else setError(data.error || 'Something went wrong.');
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setForm(BLANK_FORM);
    setFormError('');
    setFormStatus('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setFormStatus('');

    const payload = toApiPayload(form);

    const res = await fetch('/api/company/admin/toll-free', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setFormError(data.error || 'Something went wrong.');
      return;
    }
    setFormStatus(`Submitted — status: ${data.status}`);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this verification request? This cannot be undone — you would need to submit a new request.')) {
      return;
    }
    setDeleting(id);
    const res = await fetch(`/api/company/admin/toll-free/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) load();
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>Toll-Free Verification</h1>
      </div>
      <p className="dash-page-sub">
        Submit Toll-Free Verification requests directly via Telnyx's API — no need to click
        through the Portal for every new company. Note: Telnyx doesn't support editing a
        submitted request in place — to correct one, delete it and submit a new request.
      </p>

      <div className="dash-card">
        <h2>Existing requests</h2>
        {error && <p className="form-error">{error}</p>}
        {!error && verifications === null && <p className="empty-state">Loading…</p>}
        {verifications && verifications.length === 0 && (
          <p className="empty-state">No Toll-Free Verification requests found on this account.</p>
        )}
        {verifications && verifications.length > 0 && (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Business name</th>
                <th>Status</th>
                <th>Phone number(s)</th>
                <th>Reason (if rejected)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id}>
                  <td>{v.businessName}</td>
                  <td><span className="pill">{v.status}</span></td>
                  <td>{(v.phoneNumbers || []).map((p) => p.phoneNumber).join(', ') || '—'}</td>
                  <td>{v.reason || '—'}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: 13, padding: '6px 12px' }}
                      onClick={() => handleDelete(v.id)}
                      disabled={deleting === v.id}
                    >
                      {deleting === v.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn" style={{ marginTop: 16 }} onClick={startCreate}>
          Submit a new request
        </button>
      </div>

      {showForm && (
        <div className="dash-card">
          <h2>New Toll-Free Verification request</h2>
          <form onSubmit={handleSubmit}>
            <div className="dash-row">
              <div className="field">
                <label>Business name</label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Corporate website</label>
                <input
                  value={form.corporateWebsite}
                  onChange={(e) => setForm((f) => ({ ...f, corporateWebsite: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Contact first name</label>
                <input
                  value={form.businessContactFirstName}
                  onChange={(e) => setForm((f) => ({ ...f, businessContactFirstName: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Contact last name</label>
                <input
                  value={form.businessContactLastName}
                  onChange={(e) => setForm((f) => ({ ...f, businessContactLastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Contact email</label>
                <input
                  type="email"
                  value={form.businessContactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, businessContactEmail: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Contact phone</label>
                <input
                  value={form.businessContactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, businessContactPhone: e.target.value }))}
                  placeholder="+15551234567"
                  required
                />
              </div>
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Street address</label>
                <input
                  value={form.businessAddr1}
                  onChange={(e) => setForm((f) => ({ ...f, businessAddr1: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Address line 2 (optional)</label>
                <input
                  value={form.businessAddr2}
                  onChange={(e) => setForm((f) => ({ ...f, businessAddr2: e.target.value }))}
                />
              </div>
            </div>

            <div className="dash-row">
              <div className="field">
                <label>City</label>
                <input
                  value={form.businessCity}
                  onChange={(e) => setForm((f) => ({ ...f, businessCity: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>State</label>
                <input
                  value={form.businessState}
                  onChange={(e) => setForm((f) => ({ ...f, businessState: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Zip</label>
                <input
                  value={form.businessZip}
                  onChange={(e) => setForm((f) => ({ ...f, businessZip: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Entity type</label>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
                >
                  <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PRIVATE_PROFIT">Private Profit</option>
                  <option value="PUBLIC_PROFIT">Public Profit</option>
                  <option value="NON_PROFIT">Non-Profit</option>
                  <option value="GOVERNMENT">Government</option>
                </select>
              </div>
              <div className="field">
                <label>Registration type</label>
                <select
                  value={form.businessRegistrationType}
                  onChange={(e) => setForm((f) => ({ ...f, businessRegistrationType: e.target.value }))}
                >
                  <option value="EIN">EIN</option>
                  <option value="DUNS">DUNS</option>
                  <option value="CCN">CCN</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Registration number</label>
                <input
                  value={form.businessRegistrationNumber}
                  onChange={(e) => setForm((f) => ({ ...f, businessRegistrationNumber: e.target.value }))}
                  placeholder="e.g. your EIN"
                  required
                />
                <p className="field-hint">
                  Required for all new submissions as of Feb 17, 2026 — Telnyx now requires
                  business registration details on every new toll-free verification.
                </p>
              </div>
            </div>

            <div className="field">
              <label>Use case</label>
              <select
                value={form.useCase}
                onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value }))}
              >
                {USE_CASE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Use case summary</label>
              <textarea
                value={form.useCaseSummary}
                onChange={(e) => setForm((f) => ({ ...f, useCaseSummary: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <div className="field">
              <label>Sample production message content</label>
              <textarea
                value={form.productionMessageContent}
                onChange={(e) => setForm((f) => ({ ...f, productionMessageContent: e.target.value }))}
                rows={2}
                required
              />
            </div>
            <div className="field">
              <label>Opt-in workflow description</label>
              <textarea
                value={form.optInWorkflow}
                onChange={(e) => setForm((f) => ({ ...f, optInWorkflow: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <div className="field">
              <label>Opt-in proof URL(s) — comma separated</label>
              <input
                value={form.optInWorkflowImageURLs}
                onChange={(e) => setForm((f) => ({ ...f, optInWorkflowImageURLs: e.target.value }))}
                placeholder="https://www.coursingonline.com/join/business-slug"
                required
              />
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Estimated monthly message volume</label>
                <input
                  value={form.messageVolume}
                  onChange={(e) => setForm((f) => ({ ...f, messageVolume: e.target.value }))}
                  placeholder="e.g. 100"
                  required
                />
              </div>
              <div className="field">
                <label>Toll-free phone number(s) — comma separated</label>
                <input
                  value={form.phoneNumbers}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumbers: e.target.value }))}
                  placeholder="+18665551234"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>ISV / Reseller name</label>
              <input
                value={form.isvReseller}
                onChange={(e) => setForm((f) => ({ ...f, isvReseller: e.target.value }))}
                placeholder="Leave blank to use TELNYX_ISV_RESELLER_NAME default"
              />
              <p className="field-hint">
                Fill this in with your own business name (e.g. Coursing) when submitting on
                behalf of a client business whose domain differs from your Telnyx account's
                domain — otherwise Telnyx puts the request in "Waiting For Customer" status
                until this is set.
              </p>
            </div>

            <div className="field">
              <label>Additional information (optional)</label>
              <textarea
                value={form.additionalInformation}
                onChange={(e) => setForm((f) => ({ ...f, additionalInformation: e.target.value }))}
                rows={2}
              />
            </div>

            {formError && <p className="form-error">{formError}</p>}
            {formStatus && <p className="field-hint" style={{ marginBottom: 12 }}>{formStatus}</p>}

            <button className="btn" style={{ marginRight: 8 }} type="submit" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Close
            </button>
          </form>
        </div>
      )}
    </>
  );
}
