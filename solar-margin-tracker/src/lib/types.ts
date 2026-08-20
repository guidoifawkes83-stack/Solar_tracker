export interface Client {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

export interface MaterialCost {
  id: string;
  project_id: string;
  description: string;
  amount_php: number;
}

export interface Project {
  id: string;
  project_number: number;
  project_name: string;
  client_id: string | null;
  installer_id: string | null;
  project_type: "Full system" | "Supply only" | "Add-on / expansion" | "Service / repair";
  stage: "Not started" | "In progress" | "Done";
  system_size_kw: number | null;

  amount_quoted_php: number;
  amount_collected_php: number;

  install_charge_php: number;
  install_cost_php: number;

  materials_budget_php: number;
  materials_costed: boolean;

  supplier_invoice_usd: number;
  supplier_invoice_no: string | null;

  fx_rate_quoted: number | null;
  fx_rate_paid: number | null;

  commission_mode: "baked_in_invoice" | "discount_based";
  material_discount_usd: number;
  supplier_discount_usd: number;
  tt_fee_php: number;

  target_energisation: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;

  clients?: Client | null;
  material_costs?: MaterialCost[];
}
