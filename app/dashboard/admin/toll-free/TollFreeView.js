'use client';

import { useEffect, useState } from 'react';

const USE_CASE_OPTIONS = [
  'TWO_FACTOR_AUTHENTICATION', 'ACCOUNT_NOTIFICATIONS', 'CUSTOMER_CARE',
  'MARKETING', 'DELIVERY_NOTIFICATIONS', 'FRAUD_ALERT_MESSAGING', 'MIXED',
];

const OPT_IN_TYPES = ['VERBAL', 'WEB_FORM', 'PAPER_FORM', 'VIA_TEXT', 'MOBILE_QR_CODE'];

const BLANK_FORM = {
  businessName: '',
  businessWebsite: '',
  notificationEmail: '',
  useCaseCategories: ['MARKETING'],
  useCaseSummary: '',
  productionMessageSample: '',
  optInImageUrls: '',
  optInType: 'WEB_FORM',
  messageVolume: '',
  tollfreePhoneNumberSid: '',
  customerProfileSid: '',
  businessStreetAddress: '',
  businessCity: '',
  businessStateProvinceRegion: '',
  businessPostalCode: '',
  businessCountry: 'US',
  businessType: 'SOLE_PROPRIETOR',
  businessRegistrationNumber: '',
  businessRegistrationAuthority: 'EIN',
  businessRegistrationCountry: 'US',
  doingBusinessAs: '',
  optInKeywords: '',
  optInConfirmationMessage: '',
  helpMessageSample: '',
  privacyPolicyUrl: '',
  termsAndConditionsUrl: '',
  additionalInformation: '',
};

function toApiPayload(form) {
  return {
    ...form,
    useCaseCategories: form.useCaseCategories,
    optInImageUrls: form.optInImageUrls
      ? form.optInImageUrls.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    optInKeywords: form.optInKeywords
      ? form.optInKeywords.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  };
}

export default function TollFreeView() {
  const [verifications, setVerifications] = useState(null);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingSid, setEditingSid] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formStatus, setFormStatus] = useState('');

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
    setEditingSid(null);
    setFormError('');
    setFormStatus('');
    setShowForm(true);
  }

  async function startEdit(sid) {
    setFormError('');
    setFormStatus('Loading current details…');
    setShowForm(true);
    const res = await fetch(`/api/company/admin/toll-free/${sid}`);
    const data = await res.json();
    setFormStatus('');
    if (!res.ok) {
      setFormError(data.error || 'Something went wrong loading this request.');
      return;
    }
    const v = data.verification;
    setEditingSid(sid);
    setForm({
      ...BLANK_FORM,
      ...v,
      optInImageUrls: (v.optInImageUrls || []).join(', '),
      optInKeywords: (v.optInKeywords || []).join(', '),
      useCaseCategories: v.useCaseCategories || ['MARKETING'],
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setFormStatus('');

    const payload = toApiPayload(form);

    const res = editingSid
      ? await fetch(`/api/company/admin/toll-free/${editingSid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/company/admin/toll-free', {
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
    setFormStatus(`Success — status: ${data.status}`);
    load();
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>Toll-Free Verification</h1>
      </div>
      <p className="dash-page-sub">
        Submit and edit Toll-Free Verification requests directly via Twilio's API — no need to
        click through Console screens for every new company.
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
                <th>Rejection reasons</th>
                <th>Edit allowed?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.sid}>
                  <td>{v.businessName}</td>
                  <td><span className="pill">{v.status}</span></td>
                  <td>
                    {v.rejectionReasons && v.rejectionReasons.length > 0
                      ? v.rejectionReasons.map((r) => r.reason || r.code).join('; ')
                      : '—'}
                  </td>
                  <td>{v.editAllowed === true ? 'Yes' : v.editAllowed === false ? 'No' : '—'}</td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: 13, padding: '6px 12px' }}
                      onClick={() => startEdit(v.sid)}
                    >
                      View / Edit
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
          <h2>{editingSid ? `Edit request (${editingSid})` : 'New Toll-Free Verification request'}</h2>
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
                <label>Doing business as (optional)</label>
                <input
                  value={form.doingBusinessAs}
                  onChange={(e) => setForm((f) => ({ ...f, doingBusinessAs: e.target.value }))}
                />
              </div>
            </div>
            <div className="dash-row">
              <div className="field">
                <label>Business website</label>
                <input
                  value={form.businessWebsite}
                  onChange={(e) => setForm((f) => ({ ...f, businessWebsite: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Notification email</label>
                <input
                  value={form.notificationEmail}
                  onChange={(e) => setForm((f) => ({ ...f, notificationEmail: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Business type</label>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                >
                  <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
                  <option value="PRIVATE_PROFIT">Private Profit</option>
                  <option value="PUBLIC_PROFIT">Public Profit</option>
                  <option value="NON_PROFIT">Non-Profit</option>
                  <option value="GOVERNMENT">Government</option>
                </select>
              </div>
              <div className="field">
                <label>Registration number (blank if Sole Proprietor)</label>
                <input
                  value={form.businessRegistrationNumber}
                  onChange={(e) => setForm((f) => ({ ...f, businessRegistrationNumber: e.target.value }))}
                />
              </div>
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
              <label>Sample production message</label>
              <textarea
                value={form.productionMessageSample}
                onChange={(e) => setForm((f) => ({ ...f, productionMessageSample: e.target.value }))}
                rows={2}
                required
              />
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Opt-in type</label>
                <select
                  value={form.optInType}
                  onChange={(e) => setForm((f) => ({ ...f, optInType: e.target.value }))}
                >
                  {OPT_IN_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Estimated monthly message volume</label>
                <input
                  value={form.messageVolume}
                  onChange={(e) => setForm((f) => ({ ...f, messageVolume: e.target.value }))}
                  placeholder="e.g. 100"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Opt-in policy proof URL(s) — comma separated</label>
              <input
                value={form.optInImageUrls}
                onChange={(e) => setForm((f) => ({ ...f, optInImageUrls: e.target.value }))}
                placeholder="https://www.coursingonline.com/join/business-slug"
                required
              />
            </div>

            <div className="dash-row">
              <div className="field">
                <label>Privacy policy URL</label>
                <input
                  value={form.privacyPolicyUrl}
                  onChange={(e) => setForm((f) => ({ ...f, privacyPolicyUrl: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Terms and conditions URL</label>
                <input
                  value={form.termsAndConditionsUrl}
                  onChange={(e) => setForm((f) => ({ ...f, termsAndConditionsUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="field">
              <label>Opt-in keywords — comma separated</label>
              <input
                value={form.optInKeywords}
                onChange={(e) => setForm((f) => ({ ...f, optInKeywords: e.target.value }))}
                placeholder="JDVSALES159, START, YES"
              />
            </div>
            <div className="field">
              <label>Opt-in confirmation message</label>
              <textarea
                value={form.optInConfirmationMessage}
                onChange={(e) => setForm((f) => ({ ...f, optInConfirmationMessage: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="field">
              <label>Help message sample</label>
              <textarea
                value={form.helpMessageSample}
                onChange={(e) => setForm((f) => ({ ...f, helpMessageSample: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="field">
              <label>Toll-free phone number SID (PN...)</label>
              <input
                value={form.tollfreePhoneNumberSid}
                onChange={(e) => setForm((f) => ({ ...f, tollfreePhoneNumberSid: e.target.value }))}
                placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required={!editingSid}
              />
              <p className="field-hint">
                Find this in Twilio Console → Phone Numbers → your toll-free number → it's shown as
                the number's SID.
              </p>
            </div>

            <div className="field">
              <label>Customer Profile SID (BU...) — your approved ISV Primary Profile</label>
              <input
                value={form.customerProfileSid}
                onChange={(e) => setForm((f) => ({ ...f, customerProfileSid: e.target.value }))}
                placeholder="Leave blank to use TWILIO_ISV_CUSTOMER_PROFILE_SID default"
              />
            </div>

            <div className="field">
              <label>Additional information (optional)</label>
              <textarea
                value={form.additionalInformation}
                onChange={(e) => setForm((f) => ({ ...f, additionalInformation: e.target.value }))}
                rows={2}
              />
            </div>

            {editingSid && (
              <div className="field">
                <label>Edit reason (required by Twilio when editing)</label>
                <input
                  value={form.editReason || ''}
                  onChange={(e) => setForm((f) => ({ ...f, editReason: e.target.value }))}
                  placeholder="e.g. Corrected business name to match end business"
                />
              </div>
            )}

            {formError && <p className="form-error">{formError}</p>}
            {formStatus && <p className="field-hint" style={{ marginBottom: 12 }}>{formStatus}</p>}

            <button className="btn" style={{ marginRight: 8 }} type="submit" disabled={saving}>
              {saving ? 'Submitting…' : editingSid ? 'Save edit' : 'Submit request'}
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
