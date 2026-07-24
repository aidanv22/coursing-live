'use client';

import { useEffect, useState } from 'react';

export default function AdminCompaniesView() {
  const [companies, setCompanies] = useState(null);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState('');

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
  }, []);

  return (
    <>
      <div className="dash-page-head">
        <h1>All companies</h1>
      </div>
      <p className="dash-page-sub">Every business using Coursing, and what they're actually doing with it.</p>

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
