// The margin formula — deliberately kept in one small, readable place.
// Every number that goes into a project's margin flows through this file
// and nowhere else, so it can always be audited line by line.
//
// Method (confirmed with Harold, 2026-08-18):
//   Margin PHP = Amount Quoted PHP
//              − Install Cost PHP
//              − (Supplier Invoice USD × FX rate)
//              − Materials Cost (actual if costed, else the full budget — conservative)
//              − TT / Wire Transfer Fee PHP
//              + Material Discount USD × FX rate   (only for discount_based jobs)
//              + Supplier Discount USD × FX rate    (only for discount_based jobs)
//
// TT fee: a flat PHP cost for the wire transfer used to pay the supplier.
// Added 2026-08-20 for a bulk order — Harold set a single ₱20,000 TT charge
// for the whole batch and split it evenly across the 4 projects in it
// (₱5,000 each). It's just its own line item, entered per project like any
// other cost, so it's simple to change per batch/job going forward.
//
// FX rate: uses the project's fx_rate_paid if set, otherwise the live
// USD→PHP market rate passed in. No separate "FX spread gain" line —
// Harold asked to keep this simple, so the FX conversion is just a
// straight conversion at one rate, done once.
//
// commission_mode:
//   'baked_in_invoice' — the supplier already quietly discounts what Harold
//     pays (e.g. Analyn/Emerald's $800). That's already inside
//     supplier_invoice_usd, so nothing extra is added — adding it again
//     would double-count it.
//   'discount_based' — the supplier gives an explicit, separate USD discount
//     that is NOT reflected in supplier_invoice_usd (e.g. Edward's $200 off
//     materials, Alex's $400 off materials + $200 off supplier). These are
//     added on top as their own margin.

export type CommissionMode = "baked_in_invoice" | "discount_based";

export interface ProjectFinancials {
  amount_quoted_php: number;
  install_charge_php: number;
  install_cost_php: number;
  materials_budget_php: number;
  materials_costed: boolean;
  materials_actual_php?: number | null; // sum of material_costs rows, if known
  supplier_invoice_usd: number;
  fx_rate_paid?: number | null;
  commission_mode: CommissionMode;
  material_discount_usd?: number | null;
  supplier_discount_usd?: number | null;
  tt_fee_php?: number | null; // wire transfer fee for paying the supplier, flat PHP
}

export interface MarginBreakdown {
  fxRateUsed: number;
  fxRateSource: "project" | "live";
  supplierCostPhp: number;
  materialsCostPhp: number;
  materialsCostSource: "actual" | "budget (conservative — not yet costed)";
  installMarginPhp: number;
  discountAddBackPhp: number;
  ttFeePhp: number;
  totalCostPhp: number;
  marginPhp: number;
  marginPct: number;
}

export function calculateMargin(
  project: ProjectFinancials,
  liveFxRate: number
): MarginBreakdown {
  const fxRateUsed = project.fx_rate_paid && project.fx_rate_paid > 0
    ? project.fx_rate_paid
    : liveFxRate;
  const fxRateSource: "project" | "live" =
    project.fx_rate_paid && project.fx_rate_paid > 0 ? "project" : "live";

  const supplierCostPhp = project.supplier_invoice_usd * fxRateUsed;

  const usingActual =
    project.materials_costed && project.materials_actual_php != null;
  const materialsCostPhp = usingActual
    ? (project.materials_actual_php as number)
    : project.materials_budget_php;
  const materialsCostSource = usingActual
    ? "actual"
    : "budget (conservative — not yet costed)";

  const installMarginPhp = project.install_charge_php - project.install_cost_php;

  const discountAddBackPhp =
    project.commission_mode === "discount_based"
      ? ((project.material_discount_usd ?? 0) + (project.supplier_discount_usd ?? 0)) *
        fxRateUsed
      : 0;

  const ttFeePhp = project.tt_fee_php ?? 0;

  const totalCostPhp =
    project.install_cost_php + supplierCostPhp + materialsCostPhp + ttFeePhp;

  const marginPhp = project.amount_quoted_php - totalCostPhp + discountAddBackPhp;

  const marginPct =
    project.amount_quoted_php > 0 ? (marginPhp / project.amount_quoted_php) * 100 : 0;

  return {
    fxRateUsed,
    fxRateSource,
    supplierCostPhp,
    materialsCostPhp,
    materialsCostSource,
    installMarginPhp,
    discountAddBackPhp,
    ttFeePhp,
    totalCostPhp,
    marginPhp,
    marginPct,
  };
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}
