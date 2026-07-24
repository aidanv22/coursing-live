'use client';

import { useEffect, useState } from 'react';

export default function AccountSettingsPage() {
  const [currentEmail, setCurrentEmail] = useState('');

  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '' });
  const [emailError, setEmailError] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetch('/api/company/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.company) {
          setCurrentEmail(data.company.email);
          setEmailForm((f) => ({ ...f, newEmail: data.company.email }));
        }
      });
  }, []);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setEmailError('');
    setEmailStatus('');
    setEmailSaving(true);
    const res = await fetch('/api/company/account/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailForm),
    });
    const data = await res.json();
    setEmailSaving(false);
    if (!res.ok) {
      setEmailError(data.error || 'Something went wrong.');
      return;
    }
    setCurrentEmail(data.email);
    setEmailForm((f) => ({ ...f, currentPassword: '' }));
    setEmailStatus('Email updated.');
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordStatus('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    const res = await fetch('/api/company/account/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });
    const data = await res.json();
    setPasswordSaving(false);
    if (!res.ok) {
      setPasswordError(data.error || 'Something went wrong.');
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordStatus('Password updated.');
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>Account Settings</h1>
      </div>
      <p className="dash-page-sub">Your login email and password for this account.</p>

      <div className="dash-card">
        <h2>Email</h2>
        <p className="card-sub">Currently: {currentEmail || '…'}</p>
        <form onSubmit={handleEmailSubmit}>
          <div className="field">
            <label>New email</label>
            <input
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Current password</label>
            <input
              type="password"
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Confirm it's you"
              required
            />
          </div>
          {emailError && <p className="form-error">{emailError}</p>}
          {emailStatus && <p className="field-hint" style={{ marginBottom: 12 }}>{emailStatus}</p>}
          <button className="btn" type="submit" disabled={emailSaving}>
            {emailSaving ? 'Saving…' : 'Update email'}
          </button>
        </form>
      </div>

      <div className="dash-card">
        <h2>Password</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="field">
            <label>Current password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div className="dash-row">
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>
          {passwordError && <p className="form-error">{passwordError}</p>}
          {passwordStatus && (
            <p className="field-hint" style={{ marginBottom: 12 }}>
              {passwordStatus}
            </p>
          )}
          <button className="btn" type="submit" disabled={passwordSaving}>
            {passwordSaving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </>
  );
}
