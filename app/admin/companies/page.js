'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminCompaniesPage() {
  const [password, setPassword] = useState('');
  const [companies, setCompanies] = useState(null);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.companies)) {
        setCompanies(data.companies);
        setTotals(data.totals);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const th = { padding: '8px 10px', whiteSpace: 'nowrap' };
  const td = { padding: '8px 10px', whiteSpace: 'nowrap' };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '60px 24px',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', marginBottom: 24 }}>
          Companies
        </h1>
        <Link href="/admin" style={{ fontSize: 13, color: '#6E6A5F' }}>
          Waitlist admin →
        </Link>
      </div>

      {companies === null && (
        <form onSubmit={handleUnlock} style={{ display: 'flex', gap: 10, maxWidth: 340 }}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1.5px solid #2B2E2C',
              borderRadius: 2,
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#2B2E2C',
              color: '#F1EDE1',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Checking...' : 'View companies'}
          </button>
        </form>
      )}

      {error && <p style={{ color: '#8B3A3A', marginTop: 12, fontSize: 14 }}>{error}</p>}

      {companies !== null && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ border: '1.5px solid #E7E1D2', borderRadius: 4, padding: '14px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 600 }}>
                {companies.length}
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6A5F' }}>Companies</div>
            </div>
            <div style={{ border: '1.5px solid #E7E1D2', borderRadius: 4, padding: '14px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 600 }}>
                {totals?.customers ?? 0}
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6A5F' }}>Total end customers</div>
            </div>
            <div style={{ border: '1.5px solid #E7E1D2', borderRadius: 4, padding: '14px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 600 }}>
                {totals?.emailsThisMonth ?? 0}
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6A5F' }}>Emails sent this month</div>
            </div>
            <div style={{ border: '1.5px solid #E7E1D2', borderRadius: 4, padding: '14px 18px' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.5rem', fontWeight: 600 }}>
                {totals?.smsThisMonth ?? 0}
              </div>
              <div style={{ fontSize: 12.5, color: '#6E6A5F' }}>Texts sent this month</div>
            </div>
          </div>

          {companies.length === 0 ? (
            <p style={{ color: '#6E6A5F', fontSize: 14 }}>No companies have signed up yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #2B2E2C' }}>
                    <th style={th}>Company</th>
                    <th style={th}>Email</th>
                    <th style={th}>Customers</th>
                    <th style={th}>Email opt-in</th>
                    <th style={th}>SMS opt-in</th>
                    <th style={th}>Products</th>
                    <th style={th}>Promos</th>
                    <th style={th}>Campaigns sent</th>
                    <th style={th}>Emails/mo</th>
                    <th style={th}>Texts/mo</th>
                    <th style={th}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #E7E1D2' }}>
                      <td style={td}>{c.name}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.customer_count}</td>
                      <td style={td}>{c.email_opt_in_count}</td>
                      <td style={td}>{c.sms_opt_in_count}</td>
                      <td style={td}>{c.product_count}</td>
                      <td style={td}>{c.promotion_count}</td>
                      <td style={td}>{c.campaigns_sent_count}</td>
                      <td style={td}>{c.emails_this_month}</td>
                      <td style={td}>{c.sms_this_month}</td>
                      <td style={td}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
