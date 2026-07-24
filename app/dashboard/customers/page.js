'use client';

import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', emailOptIn: true, smsOptIn: false });
  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  async function load() {
    const res = await fetch('/api/company/customers');
    const data = await res.json();
    setCustomers(data.customers || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch('/api/company/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      return;
    }
    setForm({ name: '', email: '', phone: '', emailOptIn: true, smsOptIn: false });
    load();
  }

  async function handleImport(e) {
    e.preventDefault();
    setImportStatus('');
    setImporting(true);
    const res = await fetch('/api/company/customers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) {
      setImportStatus(data.error || 'Something went wrong.');
      return;
    }
    setImportStatus(`Imported ${data.imported}, skipped ${data.skipped}.`);
    setCsv('');
    load();
  }

  async function handleDelete(id) {
    await fetch(`/api/company/customers/${id}`, { method: 'DELETE' });
    load();
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditError('');
    setEditForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      emailOptIn: !!c.email_opt_in,
      smsOptIn: !!c.sms_opt_in,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  }

  async function saveEdit(id) {
    setEditSaving(true);
    setEditError('');
    const res = await fetch(`/api/company/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) {
      setEditError(data.error || 'Something went wrong.');
      return;
    }
    setEditingId(null);
    setEditForm(null);
    load();
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>Customers</h1>
      </div>
      <p className="dash-page-sub">Everyone here can receive your weekly and monthly updates.</p>

      <div className="dash-card">
        <h2>Add a customer</h2>
        <form onSubmit={handleAdd}>
          <div className="dash-row">
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+15551234567"
              />
            </div>
          </div>
          <div className="dash-row" style={{ alignItems: 'center', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.emailOptIn}
                onChange={(e) => setForm((f) => ({ ...f, emailOptIn: e.target.checked }))}
              />
              Email opt-in
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.smsOptIn}
                onChange={(e) => setForm((f) => ({ ...f, smsOptIn: e.target.checked }))}
              />
              SMS opt-in
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add customer'}
          </button>
        </form>
      </div>

      <div className="dash-card">
        <h2>Bulk import</h2>
        <p className="card-sub">Paste CSV data: name,email,phone — one row per line. Header row optional.</p>
        <form onSubmit={handleImport}>
          <div className="field">
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={'Jane Doe,jane@example.com,+15551234567\nJohn Smith,john@example.com,'}
              rows={5}
            />
          </div>
          {importStatus && <p className="field-hint" style={{ marginBottom: 10 }}>{importStatus}</p>}
          <button className="btn btn-outline" type="submit" disabled={importing}>
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
        </form>
      </div>

      <div className="dash-card">
        <h2>All customers</h2>
        {customers === null && <p className="empty-state">Loading…</p>}
        {customers && customers.length === 0 && (
          <p className="empty-state">No customers yet — add your first one above.</p>
        )}
        {customers && customers.length > 0 && (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Email</th>
                <th>SMS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id}>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={editForm.emailOptIn}
                        onChange={(e) => setEditForm((f) => ({ ...f, emailOptIn: e.target.checked }))}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={editForm.smsOptIn}
                        onChange={(e) => setEditForm((f) => ({ ...f, smsOptIn: e.target.checked }))}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn"
                        style={{ marginRight: 8, fontSize: 13, padding: '6px 12px' }}
                        onClick={() => saveEdit(c.id)}
                        disabled={editSaving}
                      >
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 13, padding: '6px 12px' }}
                        onClick={cancelEdit}
                        disabled={editSaving}
                      >
                        Cancel
                      </button>
                      {editError && <p className="form-error">{editError}</p>}
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td>{c.name || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email_opt_in ? '✓' : '—'}</td>
                    <td>{c.sms_opt_in ? '✓' : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-outline"
                        style={{ marginRight: 8, fontSize: 13, padding: '6px 12px' }}
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(c.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
