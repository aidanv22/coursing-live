'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUnlock(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.rows)) {
        setRows(data.rows);
      } else if (res.ok) {
        setError('Unexpected response from server.');
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '60px 24px',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.8rem', marginBottom: 24 }}>
        Waitlist admin
      </h1>

      {rows === null && (
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
            {loading ? 'Checking...' : 'View list'}
          </button>
        </form>
      )}

      {error && <p style={{ color: '#8B3A3A', marginTop: 12, fontSize: 14 }}>{error}</p>}

      {rows !== null && (
        <>
          <p style={{ marginBottom: 16, color: '#6E6A5F', fontSize: 14 }}>
            {rows.length} {rows.length === 1 ? 'signup' : 'signups'}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #2B2E2C' }}>
                <th style={{ padding: '8px 10px' }}>Company</th>
                <th style={{ padding: '8px 10px' }}>Email</th>
                <th style={{ padding: '8px 10px' }}>Team size</th>
                <th style={{ padding: '8px 10px' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E7E1D2' }}>
                  <td style={{ padding: '8px 10px' }}>{row.company_name}</td>
                  <td style={{ padding: '8px 10px' }}>{row.email}</td>
                  <td style={{ padding: '8px 10px' }}>{row.team_size || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
