"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

function num(form: FormData, key: string): number {
    const v = form.get(key);
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function str(form: FormData, key: string): string | null {
    const v = form.get(key);
    const s = v ? String(v).trim() : "";
    return s.length ? s : null;
}

function projectPayload(form: FormData) {
    return {
          project_name: str(form, "project_name") ?? "Untitled project",
          project_type: str(form, "project_type") ?? "Full system",
          stage: str(form, "stage") ?? "Not started",
          system_size_kw: num(form, "system_size_kw"),

          amount_quoted_php: num(form, "amount_quoted_php"),
          amount_collected_php: num(form, "amount_collected_php"),

          install_charge_php: num(form, "install_charge_php"),
          install_cost_php: num(form, "install_cost_php"),

          materials_budget_php: num(form, "materials_budget_php"),
          materials_costed: form.get("materials_costed") === "on",

          supplier_invoice_usd: num(form, "supplier_invoice_usd"),
          supplier_invoice_no: str(form, "supplier_invoice_no"),

          fx_rate_quoted: form.get("fx_rate_quoted") ? num(form, "fx_rate_quoted") : null,
          fx_rate_paid: form.get("fx_rate_paid") ? num(form, "fx_rate_paid") : null,

          commission_mode: str(form, "commission_mode") ?? "baked_in_invoice",
          material_discount_usd: num(form, "material_discount_usd"),
          supplier_discount_usd: num(form, "supplier_discount_usd"),

          misc_budget_php: form.get("misc_budget_php") ? num(form, "misc_budget_php") : 0,

          notes: str(form, "notes"),
    };
}

export async function createProject(form: FormData) {
    const supabase = supabaseAdmin();
    const clientName = str(form, "client_name");

  let clientId: string | null = null;
    if (clientName) {
          const { data: existing } = await supabase
            .from("clients")
            .select("id")
            .eq("name", clientName)
            .maybeSingle();
          if (existing) {
                  clientId = existing.id;
          } else {
                  const { data: created, error } = await supabase
                    .from("clients")
                    .insert({ name: clientName })
                    .select("id")
                    .single();
                  if (error) throw error;
                  clientId = created.id;
          }
    }

  const { data, error } = await supabase
      .from("projects")
      .insert({ ...projectPayload(form), client_id: clientId })
      .select("id")
      .single();
    if (error) throw error;

  revalidatePath("/");
    redirect(`/projects/${data.id}`);
}

export async function updateProject(projectId: string, form: FormData) {
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("projects")
      .update(projectPayload(form))
      .eq("id", projectId);
    if (error) throw error;

  revalidatePath("/");
    revalidatePath(`/projects/${projectId}`);
    redirect(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) throw error;
    revalidatePath("/");
    redirect("/");
}

export async function addMaterialCost(projectId: string, form: FormData) {
    const supabase = supabaseAdmin();
    const description = str(form, "description") ?? "Item";
    const amount = num(form, "amount_php");
    const { error } = await supabase
      .from("material_costs")
      .insert({ project_id: projectId, description, amount_php: amount });
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteMaterialCost(projectId: string, materialCostId: string) {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("material_costs").delete().eq("id", materialCostId);
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}

// --- Expenses (supplier / install / misc - materials tracked separately
// above via material_costs, which margin.ts already treats as the source
// of truth for materials actuals) ---

function expensePayload(form: FormData, projectId: string) {
    const currency = (str(form, "currency") ?? "PHP") as "PHP" | "USD";
    return {
          project_id: projectId,
          category: str(form, "category") ?? "misc",
          description: str(form, "description") ?? "Expense",
          amount: num(form, "amount"),
          currency,
          fx_rate: currency === "USD" && form.get("fx_rate") ? num(form, "fx_rate") : null,
          expense_date: str(form, "expense_date") ?? new Date().toISOString().slice(0, 10),
    };
}

export async function addExpense(projectId: string, form: FormData) {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("expenses").insert(expensePayload(form, projectId));
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}

export async function deleteExpense(projectId: string, expenseId: string) {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw error;
    revalidatePath(`/projects/${projectId}`);
}
