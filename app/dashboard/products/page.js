'use client';

import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [genStatus, setGenStatus] = useState('');

  async function load() {
    const res = await fetch('/api/company/products');
    const data = await res.json();
    setProducts(data.products || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch('/api/company/products', {
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
    setForm({ name: '', description: '', price: '' });
    load();
  }

  async function handleDelete(id) {
    await fetch(`/api/company/products/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleGenerate(productId) {
    setGenerating(productId);
    setGenStatus('');
    const res = await fetch('/api/company/campaigns/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'weekly', sourceId: productId }),
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
        <h1>Products & services</h1>
      </div>
      <p className="dash-page-sub">
        Add something new and generate a weekly update announcing it to your customers.
      </p>

      <div className="dash-card">
        <h2>Add a product or service</h2>
        <form onSubmit={handleAdd}>
          <div className="field">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Paver patio installation"
              required
            />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What it is, what makes it worth mentioning right now"
              rows={3}
            />
          </div>
          <div className="field">
            <label>Price (optional)</label>
            <input
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Starting at $18/sq ft"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add product'}
          </button>
        </form>
      </div>

      {genStatus && (
        <div className="dash-card" style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: 14 }}>{genStatus}</p>
        </div>
      )}

      <div className="dash-card">
        <h2>All products & services</h2>
        {products === null && <p className="empty-state">Loading…</p>}
        {products && products.length === 0 && (
          <p className="empty-state">Nothing here yet — add your first one above.</p>
        )}
        {products && products.length > 0 && (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td style={{ maxWidth: 320 }}>{p.description || '—'}</td>
                  <td>{p.price || '—'}</td>
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
