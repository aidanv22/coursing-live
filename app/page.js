'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetch('/api/waitlist')
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch(() => setCount(null));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) {
      setStatus('Please fill in your company name and email.');
      return;
    }
    setSubmitting(true);
    setStatus('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, email, teamSize }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("You're on the list — we'll be in touch before launch.");
        setCompanyName('');
        setEmail('');
        setTeamSize('');
        setCount(data.count);
      } else {
        setStatus(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <nav>
        <div className="logo">
          <span className="logo-mark"></span>Coursing
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a href="/login" style={{ fontSize: 14, fontWeight: 500 }}>
            Log in
          </a>
          <a href="#waitlist" className="nav-cta">
            Join the waitlist
          </a>
        </div>
      </nav>

      <div className="hero">
        <div className="courses">
          <div className="course-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="course-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="course-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="course-row">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="course-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <div className="hero-content">
          <div className="eyebrow">Built for hardscaping companies</div>
          <h1>
            Marketing, laid <em>course by course.</em>
          </h1>
          <p className="hero-sub">
            Coursing writes and sends your product promotions, new arrivals,
            and sale alerts every week and every month — so your clients
            always know what you&apos;re selling, without you writing a
            single post.
          </p>
          <div className="hero-actions">
            <a href="#waitlist" className="btn-primary">
              Join the waitlist
            </a>
            <span className="hint">
              Founding accounts get 3 months at 50% off
            </span>
          </div>
        </div>
      </div>

      <div className="joint"></div>

      <section id="problem">
        <div className="section-head">
          <span className="course-number">Course 01 — The problem</span>
          <h2>Great products. Quiet marketing.</h2>
          <p>
            Hardscaping companies are busy building — not writing
            newsletters. New pavers, restocked stone, seasonal sales, and
            clearance items go unannounced, and clients only hear about them
            when they happen to ask.
          </p>
        </div>
        <div className="problem-grid">
          <div className="problem-item">
            <div className="stat">73%</div>
            <p>
              of contractor sales come from repeat and referral clients — the
              exact people who stop hearing from you once a job wraps.
            </p>
          </div>
          <div className="problem-item">
            <div className="stat">2–3</div>
            <p>
              marketing touches most hardscaping businesses manage per
              season, versus the weekly cadence bigger retailers use to move
              product.
            </p>
          </div>
          <div className="problem-item">
            <div className="stat">0</div>
            <p>
              hours most owners have to dedicate to writing promos,
              scheduling posts, or building out email campaigns.
            </p>
          </div>
        </div>
      </section>

      <div className="joint"></div>

      <section id="how">
        <div className="section-head">
          <span className="course-number">Course 02 — How it works</span>
          <h2>One setup. A steady, standing order.</h2>
          <p>
            You tell us what you sell. We lay down the messaging in regular,
            even rows — every week, every month — so your marketing looks
            deliberate, not accidental.
          </p>
        </div>
        <div className="courses-list">
          <div className="course-item">
            <span className="course-tag">01</span>
            <div>
              <h3>Tell us your catalog and your specials</h3>
              <p>
                Send us your product list, current inventory, and any sales
                or seasonal pushes — through a simple form or a quick call.
                That&apos;s the only manual step.
              </p>
            </div>
          </div>
          <div className="course-item">
            <span className="course-tag">02</span>
            <div>
              <h3>Coursing writes the messaging for you</h3>
              <p>
                AI drafts on-brand emails, SMS blasts, and social posts
                announcing new stone, restocks, and sales — written the way a
                real hardscaper talks to clients, not like a template.
              </p>
            </div>
          </div>
          <div className="course-item">
            <span className="course-tag">03</span>
            <div>
              <h3>It goes out on a fixed schedule</h3>
              <p>
                New arrivals and general updates go out weekly. Bigger
                promotions, seasonal pushes, and inventory clearance go out
                monthly. You approve or edit in under five minutes.
              </p>
              <div className="cadence-tags">
                <span className="cadence-tag">Weekly · new products</span>
                <span className="cadence-tag">Monthly · sales & promos</span>
              </div>
            </div>
          </div>
          <div className="course-item">
            <span className="course-tag">04</span>
            <div>
              <h3>You just keep building</h3>
              <p>
                No content calendar to manage, no copywriter to brief. Your
                marketing runs in the background while you run jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="waitlist" style={{ paddingTop: '20px' }}>
        <div className="waitlist">
          <div className="wl-inner">
            <span className="course-number" style={{ color: '#8FA893' }}>
              Course 03 — Get on the list
            </span>
            <h2>Be first in line.</h2>
            <p>
              We&apos;re onboarding a small first group of hardscaping
              companies. Join the waitlist and we&apos;ll reach out before
              public launch with early access and founding pricing.
            </p>
            <form className="wl-form" onSubmit={handleSubmit}>
              <div className="wl-row">
                <input
                  type="text"
                  placeholder="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="wl-row">
                <input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="wl-row">
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                >
                  <option value="" disabled>
                    Team size
                  </option>
                  <option value="1-5">1–5 employees</option>
                  <option value="6-15">6–15 employees</option>
                  <option value="16-40">16–40 employees</option>
                  <option value="40+">40+ employees</option>
                </select>
              </div>
              <button type="submit" className="wl-submit" disabled={submitting}>
                {submitting ? 'Joining...' : 'Join the waitlist'}
              </button>
              <div className="wl-status">{status}</div>
            </form>
            <div className="wl-count">
              {count !== null && count > 0
                ? `${count} companies already on the list`
                : ''}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="mono">© 2026 Coursing</div>
        <div className="mono">
          AI marketing automation for hardscaping businesses
        </div>
      </footer>
    </>
  );
}
