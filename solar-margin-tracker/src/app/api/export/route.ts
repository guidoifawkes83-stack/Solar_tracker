import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getLiveUsdToPhp } from "@/lib/fx";
import { calculateMargin } from "@/lib/margin";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

function toCsvValue(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), material_costs(*)")
    .order("project_number", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fx = await getLiveUsdToPhp();
  const projects = data as unknown as Project[];

  const rows = projects.map((p) => {
    const materialsActual = p.material_costs?.length
      ? p.material_costs.reduce((s, m) => s + Number(m.amount_php), 0)
      : null;
    const b = calculateMargin(
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
    return {
      project_number: p.project_number,
      project_name: p.project_name,
      client: p.clients?.name ?? "",
      stage: p.stage,
      project_type: p.project_type,
      system_size_kw: p.system_size_kw,
      amount_quoted_php: p.amount_quoted_php,
      amount_collected_php: p.amount_collected_php,
      install_charge_php: p.install_charge_php,
      install_cost_php: p.install_cost_php,
      materials_budget_php: p.materials_budget_php,
      materials_costed: p.materials_costed,
      supplier_invoice_usd: p.supplier_invoice_usd,
      fx_rate_used: b.fxRateUsed,
      fx_rate_source: b.fxRateSource,
      supplier_cost_php: Math.round(b.supplierCostPhp * 100) / 100,
      materials_cost_php: b.materialsCostPhp,
      install_margin_php: b.installMarginPhp,
      discount_addback_php: Math.round(b.discountAddBackPhp * 100) / 100,
      tt_fee_php: b.ttFeePhp,
      total_cost_php: Math.round(b.totalCostPhp * 100) / 100,
      margin_php: Math.round(b.marginPhp * 100) / 100,
      margin_pct: Math.round(b.marginPct * 100) / 100,
      notes: p.notes ?? "",
    };
  });

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => toCsvValue((r as Record<string, unknown>)[h])).join(",")),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="margin-backup-${stamp}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), fx, projects: rows }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="margin-backup-${stamp}.json"`,
    },
  });
}
