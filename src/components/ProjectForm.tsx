"use client";

import { useMemo, useState } from "react";
import { calculateMargin, formatPHP, type CommissionMode } from "@/lib/margin";
import type { Project } from "@/lib/types";

interface Props {
  action: (formData: FormData) => void;
  project?: Project;
  clientName?: string;
  installerName?: string;
  liveFxRate: number;
  materialsActual?: number | null;
  submitLabel: string;
}

export default function ProjectForm({
  action,
  project,
  clientName,
  installerName,
  liveFxRate,
  materialsActual,
  submitLabel,
}: Props) {
  const [state, setState] = useState({
    amount_quoted_php: project?.amount_quoted_php ?? 0,
    install_charge_php: project?.install_charge_php ?? 0,
    install_cost_php: project?.install_cost_php ?? 0,
    materials_budget_php: project?.materials_budget_php ?? 0,
    materials_costed: project?.materials_costed ?? false,
    supplier_invoice_usd: project?.supplier_invoice_usd ?? 0,
    fx_rate_paid: project?.fx_rate_paid ?? null,
    commission_mode: (project?.commission_mode ?? "baked_in_invoice") as CommissionMode,
    material_discount_usd: project?.material_discount_usd ?? 0,
    supplier_discount_usd: project?.supplier_discount_usd ?? 0,
  });

  const breakdown = useMemo(
    () =>
      calculateMargin(
        { ...state, materials_actual_php: materialsActual ?? null },
        liveFxRate
      ),
    [state, materialsActual, liveFxRate]
  );

  const field = (key: keyof typeof state) => ({
    value: state[key] as never,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setState((s) => ({
        ...s,
        [key]:
          e.target.type === "checkbox"
            ? e.target.checked
            : e.target.type === "number"
              ? e.target.value === ""
                ? 0
                : Number(e.target.value)
              : e.target.value,
      })),
  });

  return (
    <form action={action} className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Section title="Basics">
          <Row>
            <Field label="Project name" span={2}>
              <input
                name="project_name"
                defaultValue={project?.project_name}
                required
                className={inputCls}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Client name">
              <input name="client_name" defaultValue={clientName} className={inputCls} />
            </Field>
            <Field label="Installer name">
              <input
                name="installer_name"
                defaultValue={installerName}
                placeholder="Who's doing the install"
                className={inputCls}
              />
            </Field>
          </Row>
          <Row>
            <Field label="System size (kW)">
              <input
                name="system_size_kw"
                type="number"
                step="0.01"
                defaultValue={project?.system_size_kw ?? ""}
                className={inputCls}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Project type">
              <select
                name="project_type"
                defaultValue={project?.project_type ?? "Full system"}
                className={inputCls}
              >
                <option>Full system</option>
                <option>Supply only</option>
                <option>Add-on / expansion</option>
                <option>Service / repair</option>
              </select>
            </Field>
            <Field label="Stage">
              <select name="stage" defaultValue={project?.stage ?? "Not started"} className={inputCls}>
                <option>Not started</option>
                <option>In progress</option>
                <option>Done</option>
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Money in">
          <Row>
            <Field label="Amount quoted (PHP)">
              <input
                name="amount_quoted_php"
                type="number"
                step="0.01"
                {...field("amount_quoted_php")}
                className={inputCls}
              />
            </Field>
            <Field label="Amount collected (PHP)">
              <input
                name="amount_collected_php"
                type="number"
                step="0.01"
                defaultValue={project?.amount_collected_php ?? 0}
                className={inputCls}
              />
            </Field>
          </Row>
        </Section>

        <Section title="Installation">
          <Row>
            <Field label="Install charge to client (PHP)">
              <input
                name="install_charge_php"
                type="number"
                step="0.01"
                {...field("install_charge_php")}
                className={inputCls}
              />
            </Field>
            <Field label="Install cost to you (PHP)">
              <input
                name="install_cost_php"
                type="number"
                step="0.01"
                {...field("install_cost_php")}
                className={inputCls}
              />
            </Field>
          </Row>
        </Section>

        <Section title="Materials (breakers, SPD, ATS, etc.)">
          <Row>
            <Field label="Materials budget (PHP)">
              <input
                name="materials_budget_php"
                type="number"
                step="0.01"
                {...field("materials_budget_php")}
                className={inputCls}
              />
            </Field>
            <Field label="Materials costed?">
              <label className="flex items-center gap-2 h-10 text-sm text-neutral-300">
                <input
                  name="materials_costed"
                  type="checkbox"
                  checked={state.materials_costed}
                  onChange={field("materials_costed").onChange}
                  className="h-4 w-4 rounded border-neutral-600 bg-neutral-800"
                />
                Every real purchase is logged below
              </label>
            </Field>
          </Row>
          {project && <MaterialCostsList project={project} />}
        </Section>

        <Section title="Supplier invoice">
          <Row>
            <Field label="Supplier invoice USD">
              <input
                name="supplier_invoice_usd"
                type="number"
                step="0.01"
                {...field("supplier_invoice_usd")}
                className={inputCls}
              />
            </Field>
            <Field label="Supplier invoice no.">
              <input
                name="supplier_invoice_no"
                defaultValue={project?.supplier_invoice_no ?? ""}
                className={inputCls}
              />
            </Field>
          </Row>
          <Row>
            <Field label="FX rate quoted (informational)">
              <input
                name="fx_rate_quoted"
                type="number"
                step="0.0001"
                defaultValue={project?.fx_rate_quoted ?? ""}
                className={inputCls}
              />
            </Field>
            <Field label="FX rate paid (blank = use live rate)">
              <input
                name="fx_rate_paid"
                type="number"
                step="0.0001"
                defaultValue={project?.fx_rate_paid ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    fx_rate_paid: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className={inputCls}
              />
            </Field>
          </Row>
        </Section>

        <Section title="Commission / margin terms — the haggle-friendly part">
          <Row>
            <Field label="Commission mode" span={2}>
              <select
                name="commission_mode"
                value={state.commission_mode}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    commission_mode: e.target.value as CommissionMode,
                  }))
                }
                className={inputCls}
              >
                <option value="baked_in_invoice">
                  Baked into invoice (supplier already discounts what you pay)
                </option>
                <option value="discount_based">
                  Discount-based (explicit $ off, added on top)
                </option>
              </select>
            </Field>
          </Row>
          {state.commission_mode === "discount_based" && (
            <Row>
              <Field label="Material discount (USD)">
                <input
                  name="material_discount_usd"
                  type="number"
                  step="0.01"
                  {...field("material_discount_usd")}
                  className={inputCls}
                />
              </Field>
              <Field label="Supplier discount (USD)">
                <input
                  name="supplier_discount_usd"
                  type="number"
                  step="0.01"
                  {...field("supplier_discount_usd")}
                  className={inputCls}
                />
              </Field>
            </Row>
          )}
          {state.commission_mode === "baked_in_invoice" && (
            <>
              <input type="hidden" name="material_discount_usd" value={0} />
              <input type="hidden" name="supplier_discount_usd" value={0} />
            </>
          )}
        </Section>

        <Section title="Notes">
          <textarea
            name="notes"
            rows={4}
            defaultValue={project?.notes ?? ""}
            className={inputCls}
          />
        </Section>

        <button
          type="submit"
          className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-medium"
        >
          {submitLabel}
        </button>
      </div>

      <div className="md:col-span-1">
        <div className="sticky top-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/50 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-300">Live margin preview</h3>
          <BreakdownLine label="FX rate used" value={`${breakdown.fxRateUsed.toFixed(4)} (${breakdown.fxRateSource})`} plain />
          <BreakdownLine label="Supplier cost" value={formatPHP(breakdown.supplierCostPhp)} />
          <BreakdownLine
            label={`Materials cost (${breakdown.materialsCostSource})`}
            value={formatPHP(breakdown.materialsCostPhp)}
          />
          <BreakdownLine label="Install margin" value={formatPHP(breakdown.installMarginPhp)} />
          {breakdown.discountAddBackPhp > 0 && (
            <BreakdownLine label="Discount add-back" value={formatPHP(breakdown.discountAddBackPhp)} />
          )}
          <BreakdownLine label="Total cost" value={formatPHP(breakdown.totalCostPhp)} />
          <div className="border-t border-neutral-800 pt-3 mt-3">
            <div className="text-xs text-neutral-500">Margin</div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatPHP(breakdown.marginPhp)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {breakdown.marginPct.toFixed(1)}% of quoted price
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function MaterialCostsList({ project }: { project: Project }) {
  if (!project.material_costs?.length) {
    return (
      <p className="text-xs text-neutral-500">
        No material cost line items yet — add them from the project page after saving.
      </p>
    );
  }
  return (
    <ul className="text-sm text-neutral-400 space-y-1">
      {project.material_costs.map((m) => (
        <li key={m.id} className="flex justify-between">
          <span>{m.description}</span>
          <span className="tabular-nums">{formatPHP(Number(m.amount_php))}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-800 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-neutral-300">{title}</h2>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="block text-xs text-neutral-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function BreakdownLine({
  label,
  value,
  plain,
}: {
  label: string;
  value: string;
  plain?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={plain ? "text-neutral-400" : "text-neutral-200 tabular-nums"}>{value}</span>
    </div>
  );
}

const inputCls =
  "w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600";
