// Expense-to-budget tracking, kept in one small, readable place for the
// same reason margin.ts is: every number here should be auditable at a
// glance. This is deliberately separate from margin.ts (which computes
// profit) - this file answers a different question: "are we about to blow
// past what we set aside for this project?"
//
// Four budget categories, each backed by a number already on the project
// record, with the actual spend layered on top:
//   materials - materials_budget_php, actual spend tracked via the
//               "Materials costed" line items (src/lib/margin.ts already
//               owns this number - we just read it here, no new source of
//               truth for materials).
//   supplier  - supplier_invoice_usd converted to PHP at the FX rate in
//               use. Normally one expense should match this exactly; extra
//               entries (bank fees, customs) push it over.
//   install   - install_cost_php, what's actually paid to the installer.
//   misc      - misc_budget_php, a catch-all for permits/travel/incidentals.
//
// Supplier / install / misc actuals come from the `expenses` table.
// Materials actuals come from `material_costs` (via materialsActualPhp,
// passed in) so there's exactly one source of truth per category.

import type { Expense, Project } from "./types";

export type BudgetCategory = "materials" | "supplier" | "install" | "misc";

export interface CategoryBudget {
    category: BudgetCategory;
    label: string;
    budgetPhp: number;
    spentPhp: number;
    /** spent / budget, as a fraction (1 = exactly on budget). Null when there's no budget set and nothing spent - nothing to show. */
  ratio: number | null;
    overBudget: boolean;
}

function expenseAmountPhp(expense: Expense, fallbackFxRate: number): number {
    if (expense.currency === "USD") {
          const rate = expense.fx_rate ?? fallbackFxRate;
          return Number(expense.amount) * rate;
    }
    return Number(expense.amount);
}

function sumCategory(expenses: Expense[], category: Expense["category"], fxRateUsed: number): number {
    return expenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + expenseAmountPhp(e, fxRateUsed), 0);
}

export function calculateBudgetStatus(
    project: Project,
    expenses: Expense[],
    materialsActualPhp: number | null,
    fxRateUsed: number
  ): CategoryBudget[] {
    const rows: { category: BudgetCategory; label: string; budgetPhp: number; spentPhp: number }[] = [
      {
              category: "materials",
              label: "Materials",
              budgetPhp: Number(project.materials_budget_php),
              spentPhp: materialsActualPhp ?? 0,
      },
      {
              category: "supplier",
              label: "Supplier invoice",
              budgetPhp: Number(project.supplier_invoice_usd) * fxRateUsed,
              spentPhp: sumCategory(expenses, "supplier", fxRateUsed),
      },
      {
              category: "install",
              label: "Install labor",
              budgetPhp: Number(project.install_cost_php),
              spentPhp: sumCategory(expenses, "install", fxRateUsed),
      },
      {
              category: "misc",
              label: "Miscellaneous",
              budgetPhp: Number(project.misc_budget_php ?? 0),
              spentPhp: sumCategory(expenses, "misc", fxRateUsed),
      },
        ];

  return rows.map((r) => ({
        ...r,
        ratio: r.budgetPhp > 0 ? r.spentPhp / r.budgetPhp : r.spentPhp > 0 ? Infinity : null,
        overBudget: r.spentPhp > r.budgetPhp,
  }));
}
