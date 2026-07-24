'use client';

import { useEffect, useState } from 'react';

export default function AdminCompaniesView() {
  const [companies, setCompanies] = useState(null);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState('');

  const [requests, setRequests] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [resolveError, setResolveError] = useState('');

  async function loadRequests() {
    const res = await fetch('/api/company/admin/identifier-requests');
    const data = await res.json();
    if (res.ok) setRequests(data.requests);
  }

  useEffect(() => {
    fetch('/api/company/admin/companies')
      .then((res) => res.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies);
          setTotals(data.totals);
        } else {
          setError(data.error || 'Something went wrong.');
        }
      });
    loadRequests();
  }, []);

  async function resolveRequest(id, action) {
    setResolving(id);
    setResolveError('');
    const res = await fetch(`/api/company/admin/identifier-requests/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setResolving(null);
    if (!res.ok) {
      setResolveError(data.error || 'Something went wrong.');
      return;
    }
    loadRequests();
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>All companies</h1>
      </div>
      <p className="dash-page-sub">Every business using Coursing, and what they're actually doing with it.</p>

      {requests && requests.length > 0 && (
        <div className="dash-card">
          <h2>Pending sign-up link / keyword change requests</h2>
          <p className="card-sub">
            Approving a keyword change doesn't update Twilio automatically — update your A2P
            campaign registration to match before (or right after) approving.
          </p>
          {resolveError && <p className="form-error">{resolveError}</p>}
          <table className="dash-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Current link</th>
                <th>Requested link</th>
                <th>Current keyword</th>
                <th>Requested keyword</th>
                <th>Requested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.company_name}</td>
                  <td>{r.current_slug}</td>
                  <td><strong>{r.requested_slug}</strong></td>
                  <td>{r.current_keyword}</td>
                  <td><strong>{r.requested_keyword}</strong></td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn"
                      style={{ marginRight: 8, fontSize: 13, padding: '6px 12px' }}
                      onClick={() => resolveRequest(r.id, 'approve')}
                      disabled={resolving === r.id}
                    >
                      {resolving === r.id ? '…' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => resolveRequest(r.id, 'deny')}
                      disabled={resolving === r.id}
                    >
                      Deny
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {!error && companies === null && <p className="empty-state">Loading…</p>}

      {companies && (
        <>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-num">{companies.length}</div>
              <div className="stat-label">Companies</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{totals.customers}</div>
              <div className="stat-label">Total end customers</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{totals.emailsThisMonth}</div>
              <div className="stat-label">Emails sent this month</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{totals.smsThisMonth}</div>
              <div className="stat-label">Texts sent this month</div>
            </div>
          </div>

          <div className="dash-card">
            {companies.length === 0 ? (
              <p className="empty-state">No companies have signed up yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Customers</th>
                      <th>Email opt-in</th>
                      <th>SMS opt-in</th>
                      <th>Products</th>
                      <th>Promos</th>
                      <th>Campaigns sent</th>
                      <th>Emails/mo</th>
                      <th>Texts/mo</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.customer_count}</td>
                        <td>{c.email_opt_in_count}</td>
                        <td>{c.sms_opt_in_count}</td>
                        <td>{c.product_count}</td>
                        <td>{c.promotion_count}</td>
                        <td>{c.campaigns_sent_count}</td>
                        <td>{c.emails_this_month}</td>
                        <td>{c.sms_this_month}</td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
