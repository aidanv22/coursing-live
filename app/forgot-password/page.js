'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p className="sub">Enter the email on your account and we'll send you a reset link.</p>

        {submitted ? (
          <p style={{ fontSize: 15 }}>
            If an account exists for that email, we've sent a password reset link. It expires in 1
            hour.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                required
              />
            </div>
            <button className="btn btn-patina" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
