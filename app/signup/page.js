'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    website: '',
    phone: '',
    serviceArea: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="sub">Set up Coursing for your hardscaping business.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Company name</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Carolina Stoneworks"
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@yourcompany.com"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div className="dash-row">
            <div className="field">
              <label>Website (optional)</label>
              <input
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
                placeholder="yourcompany.com"
              />
            </div>
            <div className="field">
              <label>Phone (optional)</label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="(704) 555-0100"
              />
            </div>
          </div>
          <div className="field">
            <label>Service area (optional)</label>
            <input
              value={form.serviceArea}
              onChange={(e) => update('serviceArea', e.target.value)}
              placeholder="Charlotte metro & Lake Norman"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-patina" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
