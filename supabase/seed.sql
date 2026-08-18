-- Seed data — mirrors what's currently in the Notion Projects database
-- as of 2026-08-18. Run this AFTER schema.sql, once, in the SQL Editor.

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
  commission_mode, notes
) values (
  'Analyn Estoce — 10 kW Hybrid System',
  (select id from clients where name = 'Analyn Estoce'),
  'Full system', 'In progress', 10,
  630000, 630000,
  100000, 65000,
  24000, false,
  7783, 'GPMK-PH0813-2026N-Harold Estoce',
  63, 61.4,
  'baked_in_invoice',
  'Quoted budget corrected 2026-08-18 to 630,000 (the actual agreed/collected price). $800 commission baked into supplier invoice, not itemised. Supplier revised pro forma 2026-08-17: panels 18→16, DDP now $7,783 (was $7,943).'
);

-- Emerald Kolte — 12 kW Hybrid System
insert into projects (
  project_name, client_id, project_type, stage, system_size_kw,
  amount_quoted_php, amount_collected_php,
  install_charge_php, install_cost_php,
  materials_budget_php, materials_costed,
  supplier_invoice_usd, supplier_invoice_no,
  fx_rate_quoted, fx_rate_paid,
  commission_mode, notes
) values (
  'Emerald Kolte — 12 kW Hybrid System',
  (select id from clients where name = 'Emerald Kolte'),
  'Full system', 'In progress', 12,
  750000, 650000,
  120000, 78000,
  24000, false,
  9682, 'GPMK-PH0813-2026N-Harold Estoce',
  63, 61.4,
  'baked_in_invoice',
  '$800 commission baked into supplier invoice, not itemised. Electrical package itemised in Material Costs at 19,272 against the 24,000 allowance — tick Materials Costed once confirmed to bank the ~4,728 underspend.'
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
  commission_mode, material_discount_usd, supplier_discount_usd, notes
) values (
  'Alex Arienza — 8 kW Hybrid System',
  (select id from clients where name = 'Alex Arienza'),
  'Full system', 'In progress', 8,
  470000, 450000,
  52000, 52000,
  24000, false,
  6172, 'GPMK-PH0813-2026N-Harold Estoce',
  63, 61.4,
  'discount_based', 400, 200,
  'Install sold at cost, no markup. $400 off material cost + $200 off supplier, both explicit discounts (not baked into invoice). 24,000 materials allowance is a CAP — anything above it bills to the client.'
);

-- Edward Portillo — 8 Panel Add-on
insert into projects (
  project_name, client_id, project_type, stage, system_size_kw,
  amount_quoted_php, amount_collected_php,
  install_charge_php, install_cost_php,
  materials_budget_php, materials_costed,
  supplier_invoice_usd, supplier_invoice_no,
  fx_rate_quoted, fx_rate_paid,
  commission_mode, material_discount_usd, supplier_discount_usd, notes
) values (
  'Edward Portillo — 8 Panel Add-on',
  (select id from clients where name = 'Edward Portillo'),
  'Add-on / expansion', 'In progress', 5.12,
  130000, 0,
  10000, 10000,
  14790, false,
  1670, 'GPMK-PH0813-2026N-Harold Estoce',
  63, 61.4,
  'discount_based', 200, 0,
  'Pure pass-through job. Installation flat 10,000 charged at cost. $200 off material cost is the only margin. Most of the 130,000 quoted flows straight back out to cover client-side costs — do not read it as revenue.'
);
