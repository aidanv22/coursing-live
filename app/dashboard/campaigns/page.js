'use client';

import { Fragment, useEffect, useState } from 'react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [sending, setSending] = useState(null);
  const [sendStatus, setSendStatus] = useState({});

  async function load() {
    const res = await fetch('/api/company/campaigns');
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSend(id) {
    setSending(id);
    setSendStatus((s) => ({ ...s, [id]: '' }));
    const res = await fetch(`/api/company/campaigns/${id}/send`, { method: 'POST' });
    const data = await res.json();
    setSending(null);
    setSendStatus((s) => ({
      ...s,
      [id]: res.ok
        ? `Sent — ${data.emailsSent} emails, ${data.smsSent} texts${data.failures ? `, ${data.failures} failed` : ''}.`
        : data.error || 'Something went wrong sending.',
    }));
    load();
  }

  return (
    <>
      <div className="dash-page-head">
        <h1>Campaigns</h1>
      </div>
      <p className="dash-page-sub">
        Drafts wait here for your review. Sent campaigns show what went out and when.
      </p>

      <div className="dash-card">
        {campaigns === null && <p className="empty-state">Loading…</p>}
        {campaigns && campaigns.length === 0 && (
          <p className="empty-state">
            No campaigns yet. Generate one from a product or promotion, or wait for the automatic
            weekly/monthly run.
          </p>
        )}
        {campaigns && campaigns.length > 0 && (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td>{c.subject}</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                    <td>
                      <span className={c.status === 'sent' ? 'pill pill-sent' : 'pill pill-draft'}>
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-outline"
                        style={{ marginRight: 8, fontSize: 13, padding: '6px 12px' }}
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      >
                        {expanded === c.id ? 'Hide' : 'Preview'}
                      </button>
                      {c.status === 'draft' && (
                        <button
                          className="btn btn-patina"
                          style={{ fontSize: 13, padding: '6px 12px' }}
                          onClick={() => handleSend(c.id)}
                          disabled={sending === c.id}
                        >
                          {sending === c.id ? 'Sending…' : 'Send now'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="campaign-preview">
                          <span className="cp-label">Email</span>
                          <strong>{c.subject}</strong>
                          <p style={{ marginTop: 8 }}>{c.email_body}</p>
                        </div>
                        <div className="campaign-preview">
                          <span className="cp-label">SMS</span>
                          <p>{c.sms_body}</p>
                        </div>
                        {sendStatus[c.id] && (
                          <p className="field-hint" style={{ marginTop: 10 }}>
                            {sendStatus[c.id]}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
