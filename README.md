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

## One-time setup (about 5 minutes)

### 1. Supabase — already done ✅
Your project **solar-margin-tracker** is live in your "Estoce Solar
tracker" organization (project ref `wfpizqfdnrsoxqmocxer`, Singapore
region, free tier — $0/month). The schema is created and your 4 current
jobs (Analyn, Emerald, Alex, Edward) are seeded with today's confirmed
numbers, including Analyn's corrected 630,000 quote.

The one thing left for you to grab yourself — I don't have access to it —
is the **service_role key**:
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → the
   **solar-margin-tracker** project → **Project Settings → API**.
2. Under "Project API keys", copy the **service_role** key (NOT the
   "anon"/"publishable" one).

That key is powerful — it bypasses all database restrictions. That's
intentional here (this is a single-user app gated by its own passcode),
but never put it in client-side code or share it. It only ever lives in
server environment variables (step 3 below).

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
   - `SUPABASE_URL` → `https://wfpizqfdnrsoxqmocxer.supabase.co` (already filled in `.env.example`)
   - `SUPABASE_SERVICE_ROLE_KEY` → the key you copied in step 1
   - `SITE_PASSWORD` → pick your own passcode, this is what protects the site
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

There's also a **TT / wire fee** field per project — a flat PHP cost for the
bank transfer used to pay the supplier. It's a straightforward subtraction
from margin, entered per project (e.g. a bulk order's single wire fee split
evenly across the jobs in it, as it currently is: ₱20,000 ÷ 4 = ₱5,000 each
for Analyn, Emerald, Alex, and Edward).

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

## Also included

- **Installers** — a project can be assigned to an installer (own name field,
  auto-created the first time you type a new one, same as clients).
- **Expense ledger & budget bars** — log real supplier/install/misc expenses
  against a project (`src/lib/budget.ts`) and see at a glance whether each
  category is on, near, or over budget. Materials still uses the existing
  material-cost line items as its source of truth — this doesn't duplicate it.
- **Contract generator** — "Generate contract" on a project page produces a
  ready-to-sign installation & warranty agreement (.docx) pre-filled with that
  project's details (`src/lib/contract.ts`).

None of these three affect the margin calculation in `src/lib/margin.ts` —
they're separate, additive features that read project data but never write
into the margin formula itself.
