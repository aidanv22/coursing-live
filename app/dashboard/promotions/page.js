'use client';

import { useEffect, useState } from 'react';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', discount: '', startsAt: '', endsAt: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [genStatus, setGenStatus] = useState('');

  async function load() {
    const res = await fetch('/api/company/promotions');
    const data = await res.json();
    setPromotions(data.promotions || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch('/api/company/promotions', {
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
    setForm({ title: '', description: '', discount: '', startsAt: '', endsAt: '' });
    load();
  }

  async function handleDelete(id) {
    await fetch(`/api/company/promotions/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleGenerate(promoId) {
    setGenerating(promoId);
    setGenStatus('');
    const res = await fetch('/api/company/campaigns/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'monthly', sourceId: promoId }),
    });
    const data = await res.json();
    setGenerating(null);
    setGenStatus(
      res.ok
        ? 'Draft campaign created — review it in Campaigns.'
        : data.error || 'Something went wrong generating the campaign.'
    );
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>Promotions</h1>
      </div>
      <p className="dash-page-sub">
        Add a sale or discount and generate a monthly update announcing it to your customers.
      </p>

      <div className="dash-card">
        <h2>Add a promotion</h2>
        <form onSubmit={handleAdd}>
          <div className="field">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Fall patio special"
              required
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What the promotion covers, any conditions"
              rows={3}
            />
          </div>
          <div className="dash-row">
            <div className="field">
              <label>Discount</label>
              <input
                value={form.discount}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                placeholder="15% off, or $500 off"
              />
            </div>
            <div className="field">
              <label>Starts</label>
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Ends</label>
              <input
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add promotion'}
          </button>
        </form>
      </div>

      {genStatus && (
        <div className="dash-card" style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: 14 }}>{genStatus}</p>
        </div>
      )}

      <div className="dash-card">
        <h2>All promotions</h2>
        {promotions === null && <p className="empty-state">Loading…</p>}
        {promotions && promotions.length === 0 && (
          <p className="empty-state">Nothing here yet — add your first one above.</p>
        )}
        {promotions && promotions.length > 0 && (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Discount</th>
                <th>Window</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.discount || '—'}</td>
                  <td>
                    {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : '—'} –{' '}
                    {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : 'ongoing'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-outline"
                      style={{ marginRight: 8, fontSize: 13, padding: '6px 12px' }}
                      onClick={() => handleGenerate(p.id)}
                      disabled={generating === p.id}
                    >
                      {generating === p.id ? 'Writing…' : 'Generate update'}
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
