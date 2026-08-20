-- Seed data — snapshot of the 4 real jobs as confirmed with Harold, current
-- as of 2026-08-20. Run this ONCE against an EMPTY database (Project → SQL
-- Editor → New query → paste → Run), right after schema.sql.
--
-- NOTE: this is a one-time bootstrap script, not a live mirror. Once the
-- database exists, all further changes happen through the app (or directly
-- in Supabase) — re-running this file against a database that already has
-- these projects will create duplicates, since only the `clients` insert is
-- idempotent (`on conflict do nothing`). If you ever need to rebuild from
-- scratch, wipe the `projects`/`material_costs` tables first.

insert into clients (name) values
  ('Analyn Estoce'),
  ('Emerald Kolte'),
  ('Alex Arienza'),
  ('Edward Portillo')
on conflict do nothing;

-- Analyn Estoce — 10 kW Hybrid System
insert into projects (
  project_name, client_id, project_type, stage, system_size_kw,
  amount_quoted_php, amount_collected_php,
  install_charge_php, install_cost_php,
  materials_budget_php, materials_costed,
  supplier_invoice_usd, supplier_invoice_no,
  fx_rate_quoted, fx_rate_paid,
  commission_mode, material_discount_usd, supplier_discount_usd, tt_fee_php, notes
) values (
  'Analyn Estoce — 10 kW Hybrid System',
  (select id from clients where name = 'Analyn Estoce'),
  'Full system', 'In progress', 10,
  630000, 630000,
  100000, 65000,
  20000, false,
  7783, 'GPMK-PH0813-2026N-Harold Estoce',
  63, null,
  'discount_based', 800, 0, 5000,
  'Quoted budget confirmed 2026-08-18 at 630,000 (the actual agreed/collected price). Per the actual proforma invoice (GPMK-PH0813-2026N), the $7,783 DDP price explicitly states "Included USD800 commission" — the $800 is embedded IN the invoice total, not already netted out of it, so commission_mode is discount_based with an $800 material_discount_usd add-back (true material cost is $7,783 − $800 = $6,983). Supplier revised pro forma 2026-08-17: panels 18→16, DDP now $7,783 (was $7,943). Extras/materials budget 20,000. fx_rate_paid left blank so the app converts at the live market rate. Bulk order TT/wire fee of 20,000 split evenly across the 4 projects in this order — 5,000 each (2026-08-20).'
);

-- Emerald Kolte — 12 kW Hybrid System
insert into projects (
  project_name, client_id, project_type, stage, system_size_kw,
  amount_quoted_php, amount_collected_php,
  install_charge_php, install_cost_php,
  materials_budget_php, materials_costed,
  supplier_invoice_usd, supplier_invoice_no,
  fx_rate_quoted, fx_rate_paid,
  commission_mode, material_discount_usd, supplier_discount_usd, tt_fee_php, notes
) values (
  'Emerald Kolte — 12 kW Hybrid System',
  (select id from clients where name = 'Emerald Kolte'),
  'Full system', 'In progress', 12,
  750000, 650000,
  120000, 78000,
  24000, false,
  9682, 'GPMK-PH0813-2026N-Harold Estoce',
  62, null,
  'discount_based', 800, 0, 5000,
  '$800 commission included in the $9,682 proforma DDP price, same structure as Analyn''s invoice — commission_mode is discount_based with an $800 material_discount_usd add-back (true material cost is $9,682 − $800 = $8,882). Electrical package itemised in Material Costs at 19,272 against the 24,000 allowance — tick Materials Costed once confirmed to bank the ~4,728 underspend. fx_rate_paid left blank so the app converts at the live market rate. Bulk order TT/wire fee of 20,000 split evenly across the 4 projects in this order — 5,000 each (2026-08-20).'
);

insert into material_costs (project_id, description, amount_php)
select id, 'Electrical package (breakers/SPD/ATS)', 19272
from projects where project_name = 'Emerald Kolte — 12 kW Hybrid System';

-- Alex Arienza — 8 kW Hybrid System
insert into projects (
  project_name, client_id, project_type, stage, system_size_kw,
  amount_quoted_php, amount_collected_php,
  install_charge_php, install_cost_php,
  materials_budget_php, materials_costed,
  supplier_invoice_usd, supplier_invoice_no,
  fx_rate_quoted, fx_rate_paid,
  commission_mode, material_discount_usd, supplier_discount_usd, tt_fee_php, notes
) values (
  'Alex Arienza — 8 kW Hybrid System',
  (select id from clients where name = 'Alex Arienza'),
  'Full system', 'In progress', 8,
  470000, 450000,
  52000, 52000,
  20000, false,
  6172, 'GPMK-PH0813-2026N-Harold Estoce',
  63, null,
  'discount_based', 400, 200, 5000,
  'Install sold at cost, no markup. $400 off material cost + $200 off supplier, both explicit discounts (not baked into invoice). Quoted amount confirmed 2026-08-20 at 470,000. Materials allowance corrected to 20,000 (a CAP — anything above it bills to the client). fx_rate_paid left blank so the app converts at the live market rate. Bulk order TT/wire fee of 20,000 split evenly across the 4 projects in this order — 5,000 each (2026-08-20).'
);

-- Edward Portillo — 8 Panel Add-on
insert into projects (
  project_name, client_id, project_type, stage, system_size_kw,
  amount_quoted_php, amount_collected_php,
  install_charge_php, install_cost_php,
  materials_budget_php, materials_costed,
  supplier_invoice_usd, supplier_invoice_no,
  fx_rate_quoted, fx_rate_paid,
  commission_mode, material_discount_usd, supplier_discount_usd, tt_fee_php, notes
) values (
  'Edward Portillo — 8 Panel Add-on',
  (select id from clients where name = 'Edward Portillo'),
  'Add-on / expansion', 'In progress', 5.12,
  130000, 0,
  10000, 10000,
  14790, false,
  1670, 'GPMK-PH0813-2026N-Harold Estoce',
  63, null,
  'discount_based', 200, 0, 5000,
  'Pure pass-through job. Installation flat 10,000 charged at cost. $200 off material cost is the only margin. Most of the 130,000 quoted flows straight back out to cover client-side costs — do not read it as revenue. fx_rate_paid left blank so the app converts at the live market rate. Bulk order TT/wire fee of 20,000 split evenly across the 4 projects in this order — 5,000 each (2026-08-20).'
);
