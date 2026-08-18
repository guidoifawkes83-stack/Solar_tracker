import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { getLiveUsdToPhp } from "@/lib/fx";
import ProjectForm from "@/components/ProjectForm";
import {
  updateProject,
  deleteProject,
  addMaterialCost,
  deleteMaterialCost,
  addExpense,
  deleteExpense,
} from "../actions";
import type { Expense, Project } from "@/lib/types";
import { formatPHP } from "@/lib/margin";
import { calculateBudgetStatus, type CategoryBudget } from "@/lib/budget";

export const dynamic = "force-dynamic";

async function getProject(id: string): Promise<Project | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), material_costs(*), expenses(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Project | null;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, fx] = await Promise.all([getProject(id), getLiveUsdToPhp()]);
  if (!project) notFound();

  const materialsActual = project.material_costs?.length
    ? project.material_costs.reduce((s, m) => s + Number(m.amount_php), 0)
    : null;

  const fxRateUsed =
    project.fx_rate_paid && project.fx_rate_paid > 0 ? project.fx_rate_paid : fx.rate;

  const expenses = project.expenses ?? [];
  const budgetStatus = calculateBudgetStatus(project, expenses, materialsActual, fxRateUsed);

  const boundUpdate = updateProject.bind(null, project.id);
  const boundDelete = deleteProject.bind(null, project.id);
  const boundAddMaterial = addMaterialCost.bind(null, project.id);
  const boundAddExpense = addExpense.bind(null, project.id);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
              ← All projects
            </Link>
            <h1 className="text-xl font-semibold mt-1">
              {project.project_name}{" "}
              <span className="text-neutral-500 font-normal">
                (PRJ-{project.project_number})
              </span>
            </h1>
          </div>
          <form action={boundDelete}>
            <button
              type="submit"
              className="text-xs text-red-400 hover:text-red-300 border border-red-900 rounded-md px-3 py-1.5"
            >
              Delete project
            </button>
          </form>
        </div>

        <ProjectForm
          action={boundUpdate}
          project={project}
          clientName={project.clients?.name}
          liveFxRate={fx.rate}
          materialsActual={materialsActual}
          submitLabel="Save changes"
        />

        <div className="border border-neutral-800 rounded-xl p-5 mt-6 max-w-md">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Add a material cost line item
          </h2>
          <form action={boundAddMaterial} className="flex gap-2">
            <input
              name="description"
              placeholder="e.g. Breaker box"
              required
              className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
            />
            <input
              name="amount_php"
              type="number"
              step="0.01"
              placeholder="₱ amount"
              required
              className="w-32 rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-2 text-sm"
            >
              Add
            </button>
          </form>
          {project.material_costs && project.material_costs.length > 0 && (
            <ul className="mt-4 space-y-2">
              {project.material_costs.map((m) => {
                const boundDeleteMaterial = deleteMaterialCost.bind(null, project.id, m.id);
                return (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{m.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-neutral-400">
                        {formatPHP(Number(m.amount_php))}
                      </span>
                      <form action={boundDeleteMaterial}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border border-neutral-800 rounded-xl p-5 mt-6">
          <h2 className="text-sm font-semibold text-neutral-300 mb-1">Expenses & budget</h2>
          <p className="text-xs text-neutral-500 mb-4">
            Every real expense against this project, by category, against what was budgeted.
            Materials pulls from the line items above; log supplier, install, and misc costs
            below as they come in so nothing runs over budget unnoticed.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {budgetStatus.map((b) => (
              <BudgetBar key={b.category} budget={b} />
            ))}
          </div>

          <h3 className="text-xs font-semibold text-neutral-400 mb-2">
            Add a supplier / install / misc expense
          </h3>
          <form
            action={boundAddExpense}
            className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end mb-4"
          >
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-neutral-500 mb-1">Category</label>
              <select
                name="category"
                required
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-2 text-sm"
              >
                <option value="supplier">Supplier</option>
                <option value="install">Install</option>
                <option value="misc">Misc</option>
              </select>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-neutral-500 mb-1">Description</label>
              <input
                name="description"
                placeholder="e.g. Customs fee"
                required
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Amount</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Currency</label>
              <select
                name="currency"
                defaultValue="PHP"
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-2 py-2 text-sm"
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">
                FX rate (USD only)
              </label>
              <input
                name="fx_rate"
                type="number"
                step="0.0001"
                placeholder={`blank = ${fxRateUsed.toFixed(2)}`}
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2 sm:col-span-6 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium"
              >
                Add expense
              </button>
            </div>
          </form>

          {expenses.length > 0 ? (
            <ul className="space-y-2">
              {[...expenses]
                .sort((a, b) => a.expense_date.localeCompare(b.expense_date))
                .map((e) => {
                  const boundDeleteExpense = deleteExpense.bind(null, project.id, e.id);
                  return (
                    <li
                      key={e.id}
                      className="flex items-center justify-between text-sm border-t border-neutral-800 pt-2 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryTag category={e.category} />
                        <span className="text-neutral-300">{e.description}</span>
                        <span className="text-neutral-600 text-xs">{e.expense_date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-neutral-400">
                          {e.currency === "USD"
                            ? `$${Number(e.amount).toFixed(2)} → ${formatPHP(
                                Number(e.amount) * (e.fx_rate ?? fxRateUsed)
                              )}`
                            : formatPHP(Number(e.amount))}
                        </span>
                        <form action={boundDeleteExpense}>
                          <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                            ✕
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-xs text-neutral-500">
              No supplier / install / misc expenses logged yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BudgetBar({ budget }: { budget: CategoryBudget }) {
  const pct = budget.ratio === null ? 0 : Math.min(budget.ratio * 100, 100);
  const overflowPct = budget.ratio !== null && budget.ratio > 1 ? Math.min((budget.ratio - 1) * 100, 100) : 0;
  const barColor = budget.overBudget
    ? "bg-red-500"
    : budget.ratio !== null && budget.ratio >= 0.9
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="border border-neutral-800 rounded-lg p-3">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-neutral-200">{budget.label}</span>
        <span
          className={`text-xs font-semibold ${
            budget.overBudget ? "text-red-400" : "text-neutral-400"
          }`}
        >
          {budget.ratio === null ? "—" : `${(budget.ratio * 100).toFixed(0)}%`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
        {overflowPct > 0 && (
          <div
            className="h-full bg-red-600 -mt-2 opacity-70"
            style={{ width: `${overflowPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-neutral-500">
        <span>{formatPHP(budget.spentPhp)} spent</span>
        <span>{formatPHP(budget.budgetPhp)} budget</span>
      </div>
      {budget.overBudget && (
        <p className="text-xs text-red-400 mt-1">
          Over budget by {formatPHP(budget.spentPhp - budget.budgetPhp)}
        </p>
      )}
    </div>
  );
}

function CategoryTag({ category }: { category: Expense["category"] }) {
  const styles: Record<Expense["category"], string> = {
    supplier: "bg-blue-950 text-blue-400",
    install: "bg-purple-950 text-purple-400",
    misc: "bg-neutral-800 text-neutral-400",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[category]}`}>
      {category}
    </span>
  );
}
