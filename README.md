# Solar Margin Tracker

A password-protected project & margin tracker — the replacement for the
Notion "Projects" database. Built with Next.js, hosted on Vercel, data in
Supabase (Postgres). No subscription to any AI app builder — this is plain
code you own outright.

## What it does

- Tracks every job (client, quote, install cost, supplier invoice, FX rate).
- Computes margin with one transparent formula (`src/lib/margin.ts`) —
  every number is visible, nothing is a black box.
- Commission/margin terms are **editable per project** — a job with special
  haggle terms (like a flat discount instead of a baked-in commission) just
  gets its own settings, no code changes needed.
- Converts USD→PHP using the live market rate automatically (no manual FX
  spread math), unless you set a specific rate on a project.
- One-click CSV/JSON export for an offline backup, any time.

## One-time setup (about 10 minutes)

### 1. Create a free Supabase project
1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New Project**. Pick any name and a database password (save it
   somewhere — you likely won't need it day-to-day, the app doesn't use it).
3. Once it's ready, go to **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql`, and run it.
4. Optional but recommended: also run `supabase/seed.sql` in a second query
   to pre-load your 4 current jobs (Analyn, Emerald, Alex, Edward) with
   today's confirmed numbers.
5. Go to **Project Settings → API**. You'll need two values from here:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role key** (under "Project API keys", NOT the "anon" key)
     → this is `SUPABASE_SERVICE_ROLE_KEY`

The service_role key is powerful — it bypasses all database restrictions.
That's intentional here (the app is single-user, gated by its own
passcode), but never put it in client-side code or share it. It only ever
lives in server environment variables.

### 2. Push this code to GitHub
```bash
cd solar-margin-tracker
git remote add origin <your-empty-github-repo-url>
git branch -M main
git push -u origin main
```
(If you don't have a GitHub repo yet: create a new empty one at
github.com/new, then run the commands above with its URL.)

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com), sign up / log in, **Add New →
   Project**, and import the GitHub repo you just pushed.
2. Before deploying, add three **Environment Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_PASSWORD` — pick your own passcode, this is what protects the site
3. Click **Deploy**. In under a minute you'll get a live URL
   (`your-project.vercel.app`) that only opens after entering the passcode.

That's it — online backup done. To back up offline, click **Export CSV** or
**Export JSON** on the dashboard any time and save the file locally.

## Local development

```bash
cp .env.example .env.local   # fill in the three values
npm install
npm run dev
```

## The margin formula, in one place

`src/lib/margin.ts` is the entire calculation — nothing else in the app
touches these numbers. It was built and verified against Analyn's confirmed
margin (₱61,300, checked to the centavo) before anything else was built on
top of it. Run `npx tsx src/lib/margin.test.ts` any time to re-verify it.

Two commission modes, chosen per project:
- **Baked into invoice** — the supplier already quietly discounts what you
  pay (e.g. the $800 folded into Analyn/Emerald's pro forma). Nothing extra
  is added; it's already reflected in the lower invoice number.
- **Discount-based** — an explicit, separate USD discount off materials
  and/or the supplier price (e.g. Edward's $200 off materials, Alex's $400
  off materials + $200 off supplier). Added on top as its own line.

This is exactly the "haggle" flexibility you asked for: a big client who
negotiates a special deal just gets their own discount numbers on their
project — the formula itself never needs to change.
