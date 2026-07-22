# Coursing

AI marketing automation for hardscaping companies. Every hardscaping business
gets an account, adds their customer list, and adds products/services (weekly
triggers) and promotions (monthly triggers). Coursing writes the email + SMS
copy with Claude, and sends it — either on demand or automatically on a
weekly/monthly cron schedule.

## What's in this repo

- **Public landing page** (`/`) — waitlist signup, unchanged from before.
- **`/admin`** — password-protected view of waitlist signups.
- **`/signup`, `/login`** — hardscaping companies create an account.
- **`/dashboard`** — the actual product:
  - **Overview** — quick stats, setup checklist
  - **Products** — add a product/service, generate a weekly update for it
  - **Promotions** — add a sale/discount, generate a monthly update for it
  - **Customers** — add contacts one at a time or bulk-import via pasted CSV
  - **Campaigns** — review AI-written drafts (email + SMS) and send, or see
    what's already gone out
  - **Settings** — business info + "brand voice" (fed directly into the AI
    prompt so copy sounds like the company, not generic AI copy)
- **`/api/cron/weekly`** and **`/api/cron/monthly`** — scanned by Vercel Cron
  (see `vercel.json`). For every company, finds any product/promotion that
  doesn't have a campaign yet, generates copy, and sends it automatically to
  opted-in customers. This is what makes the "weekly/monthly, hands off"
  pitch actually true — a company owner can just add a product and walk away.

## Tech stack

Next.js (App Router) + Neon Postgres (via Vercel Marketplace) + Vercel
hosting + Vercel Cron, Claude API for copywriting, Resend for email, Twilio
for SMS.

## Setup

### 1. Environment variables

Copy `.env.example` to `.env.local` for local dev, and add the same keys in
Vercel (Project Settings → Environment Variables) for production.

- `DATABASE_URL` — already wired up if you've connected Neon via the Vercel
  Marketplace integration, as in the original setup.
- `SESSION_SECRET` — any random string, e.g. `openssl rand -hex 32`. This
  signs company login sessions — don't lose it or everyone gets logged out,
  don't leak it or sessions can be forged.
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com).
  This is what writes the campaign copy.
- `RESEND_API_KEY` — from [resend.com](https://resend.com). Free tier is
  plenty to start. Verify your own sending domain there when you're ready to
  send as a custom "from" address (until then it falls back to Resend's
  shared testing domain).
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — from
  [twilio.com](https://twilio.com). You'll need a Twilio phone number capable
  of sending SMS.
- `CRON_SECRET` — optional but recommended once this is live, so random
  people on the internet can't hit your cron endpoints and force-send
  campaigns. Set the same value in Vercel's Cron Secret setting.

### 2. Deploy

Push to `aidanv22/coursing-live` as usual — Vercel picks it up automatically.
The database schema creates itself on first request (same pattern as the
original waitlist table), so there's no migration step to run manually.

### 3. Cron schedule

`vercel.json` schedules:
- Weekly: Mondays at 9am ET (`0 13 * * 1`, in UTC)
- Monthly: 1st of the month at 9am ET (`0 13 1 * *`, in UTC)

Change these anytime in `vercel.json` — Vercel picks up cron changes on the
next deploy. Cron jobs only run on Vercel's Pro plan or above for schedules
tighter than once/day on Hobby — check your current plan's cron limits if
the jobs don't seem to be firing.

## How a company actually uses this, end to end

1. Sign up at `/signup`
2. Fill in **Settings** — brand voice matters most here, it's what keeps the
   AI copy from sounding like generic AI copy
3. Add customers in **Customers** (paste a CSV export from wherever their
   contact list already lives)
4. Add a product in **Products** → click "Generate update" → review the
   draft in **Campaigns** → click "Send now" (or just wait — the weekly cron
   will pick up any product that doesn't have a campaign yet)
5. Same idea for **Promotions** on the monthly cycle

## Known rough edges (fine for a pilot, worth tightening before scaling)

- No email/SMS unsubscribe link yet — before sending to real customers who
  didn't explicitly opt in through you, add one (Resend and Twilio both
  support this, and it's a legal requirement — CAN-SPAM / TCPA — not just a
  nice-to-have).
- No password reset flow — if a company forgets their password, you'd need
  to reset it manually in the database for now.
- Cron auto-send goes out immediately with no human review step. Fine for a
  trusted pilot user; you may want a "review window" before wider rollout.
- No rate limiting on the API routes.
