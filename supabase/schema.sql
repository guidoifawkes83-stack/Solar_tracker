-- Solar Margin Tracker — Supabase schema
-- Run this in Supabase: Project → SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto";

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists installers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  project_number serial,                          -- display id, e.g. PRJ-1
  project_name text not null,
  client_id uuid references clients(id) on delete set null,
  installer_id uuid references installers(id) on delete set null,
  project_type text not null default 'Full system'
    check (project_type in ('Full system','Supply only','Add-on / expansion','Service / repair')),
  stage text not null default 'Not started'
    check (stage in ('Not started','In progress','Done')),
  system_size_kw numeric,

  -- money the client pays
  amount_quoted_php numeric not null default 0,
  amount_collected_php numeric not null default 0,

  -- installation
  install_charge_php numeric not null default 0,   -- what you charge the client for install
  install_cost_php numeric not null default 0,      -- what install actually costs you

  -- materials / extras (breakers, SPD, ATS, etc — separate from the panel/inverter/battery supplier invoice)
  materials_budget_php numeric not null default 0,
  materials_costed boolean not null default false,   -- tick once every real materials purchase is logged
  -- materials_actual_php is DERIVED: sum(material_costs.amount_php) if materials_costed, else materials_budget_php (conservative)

  -- supplier (panels/inverter/battery) invoice
  supplier_invoice_usd numeric not null default 0,   -- DDP total on the pro forma. May already have commission baked in (see commission_mode).
  supplier_invoice_no text,

  -- FX
  fx_rate_quoted numeric,        -- rate you priced the client at (informational only — not used in the simplified margin calc)
  fx_rate_paid numeric,          -- rate your bank actually charged, or leave null to use today's live rate

  -- margin / commission structure — THIS is what's editable per job for haggling clients
  commission_mode text not null default 'baked_in_invoice'
    check (commission_mode in ('baked_in_invoice','discount_based')),
  -- 'baked_in_invoice': your cut is already silently folded into supplier_invoice_usd (e.g. Analyn/Emerald's $800) — no extra add needed.
  -- 'discount_based': supplier gives you a separate, explicit $ discount off list price — added on top as extra margin.
  material_discount_usd numeric not null default 0,  -- e.g. Edward's $200 off materials, Alex's $400
  supplier_discount_usd numeric not null default 0,  -- e.g. Alex's extra $200 off supplier

  target_energisation date,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists material_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  description text not null,
  amount_php numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- Row Level Security: locked down. The app talks to Supabase using the
-- service role key from server-side code only, so RLS stays fully closed
-- and nothing is reachable with the public anon key. Password protection
-- for the UI itself is handled in the Next.js app, not here.
alter table clients enable row level security;
alter table installers enable row level security;
alter table projects enable row level security;
alter table material_costs enable row level security;
alter table milestones enable row level security;
-- (no policies created — service role bypasses RLS automatically; anon key gets nothing)
