import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getLiveUsdToPhp } from "@/lib/fx";
import { calculateMargin, formatPHP } from "@/lib/margin";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic"; // always fresh — this is money data

async function getProjects(): Promise<Project[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), material_costs(*)")
    .order("project_number", { ascending: true });
  if (error) throw error;
  return data as unknown as Project[];
}

export default async function DashboardPage() {
  const [projects, fx] = await Promise.all([getProjects(), getLiveUsdToPhp()]);

  const rows = projects.map((p) => {
    const materialsActual = p.material_costs?.length
      ? p.material_costs.reduce((sum, m) => sum + Number(m.amount_php), 0)
      : null;

    const breakdown = calculateMargin(
      {
        amount_quoted_php: Number(p.amount_quoted_php),
        install_charge_php: Number(p.install_charge_php),
        install_cost_php: Number(p.install_cost_php),
        materials_budget_php: Number(p.materials_budget_php),
        materials_costed: p.materials_costed,
        materials_actual_php: materialsActual,
        supplier_invoice_usd: Number(p.supplier_invoice_usd),
        fx_rate_paid: p.fx_rate_paid,
        commission_mode: p.commission_mode,
        material_discount_usd: Number(p.material_discount_usd),
        supplier_discount_usd: Number(p.supplier_discount_usd),
        tt_fee_php: Number(p.tt_fee_php),
      },
      fx.rate
    );
    return { project: p, breakdown };
  });

  rows.sort((a, b) => a.breakdown.marginPhp - b.breakdown.marginPhp);

  const totalMargin = rows.reduce((s, r) => s + r.breakdown.marginPhp, 0);
  const totalQuoted = rows.reduce((s, r) => s + Number(r.project.amount_quoted_php), 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Solar Margin Tracker</h1>
            <p className="text-sm text-neutral-400 mt-1">
              USD→PHP: <span className="text-neutral-200">{fx.rate.toFixed(4)}</span>{" "}
              <span className="text-neutral-500">
                ({fx.source === "live" ? `live, ${fx.asOf}` : "fallback rate"})
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/projects/new"
              className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium"
            >
              + New Project
            </Link>
            <a
              href="/api/export?format=csv"
              className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm font-medium border border-neutral-700"
            >
              Export CSV
            </a>
            <a
              href="/api/export?format=json"
              className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm font-medium border border-neutral-700"
            >
              Export JSON
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Projects" value={String(rows.length)} />
          <SummaryCard label="Total Quoted" value={formatPHP(totalQuoted)} />
          <SummaryCard label="Total Margin" value={formatPHP(totalMargin)} accent />
          <SummaryCard
            label="Blended Margin %"
            value={totalQuoted ? `${((totalMargin / totalQuoted) * 100).toFixed(1)}%` : "—"}
          />
        </div>

        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium text-right">Quoted</th>
                <th className="px-4 py-3 font-medium text-right">Total Cost</th>
                <th className="px-4 py-3 font-medium text-right">Margin</th>
                <th className="px-4 py-3 font-medium text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project, breakdown }) => (
                <tr
                  key={project.id}
                  className="border-t border-neutral-800 hover:bg-neutral-900/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-neutral-100 hover:text-emerald-400"
                    >
                      {project.project_name}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {project.clients?.name ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={project.stage} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPHP(Number(project.amount_quoted_php))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-400">
                    {formatPHP(breakdown.totalCostPhp)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-semibold ${
                      breakdown.marginPhp < 30000 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {formatPHP(breakdown.marginPhp)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-400">
                    {breakdown.marginPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No projects yet. Run <code>supabase/seed.sql</code> or add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-neutral-600 mt-4">
          Materials cost conservatively assumes the full budget is spent until
          &quot;Materials Costed&quot; is confirmed on a project.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900/50">
      <div className="text-xs text-neutral-500">{label}</div>
      <div
        className={`text-xl font-semibold mt-1 ${accent ? "text-emerald-400" : "text-neutral-100"}`}
      >
        {value}
      </div>
    </div>
  );
}

function StageBadge({ stage }: { stage: Project["stage"] }) {
  const styles: Record<Project["stage"], string> = {
    "Not started": "bg-neutral-800 text-neutral-400",
    "In progress": "bg-blue-950 text-blue-400",
    Done: "bg-emerald-950 text-emerald-400",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${styles[stage]}`}>
      {stage}
    </span>
  );
}
