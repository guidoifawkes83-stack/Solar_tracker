export interface Client {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
}

export interface Installer {
    id: string;
    name: string;
}

export interface MaterialCost {
    id: string;
    project_id: string;
    description: string;
    amount_php: number;
}

export type ExpenseCategory = "supplier" | "install" | "misc";

export interface Expense {
    id: string;
    project_id: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency: "PHP" | "USD";
    fx_rate: number | null;
    expense_date: string;
    created_at: string;
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

  // wire transfer (TT) fee for paying the supplier, flat PHP, entered per project
  tt_fee_php: number;

  // budget for expenses that don't fall under materials / supplier / install
  // (permits, travel, incidentals, etc.) — see src/lib/budget.ts
  misc_budget_php: number;

  target_energisation: string | null;
    notes: string | null;

  created_at: string;
    updated_at: string;

  clients?: Client | null;
    installers?: Installer | null;
    material_costs?: MaterialCost[];
    expenses?: Expense[];
}
