import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseInvoiceText } from "@/lib/pdf-invoice";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file received." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "That doesn't look like a PDF." }, { status: 400 });
  }

  let text: string;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    text = result.text;
    await parser.destroy();
  } catch (err) {
    console.error("parse-invoice PDF read failed:", err);
    return NextResponse.json(
      { error: "Couldn't read that PDF — it may be a scanned image rather than a text PDF." },
      { status: 422 }
    );
  }

  const parsed = parseInvoiceText(text);

  const foundParts: string[] = [];
  if (parsed.supplier_invoice_usd != null) {
    foundParts.push(
      `${parsed.supplier_price_label ?? "total"} $${parsed.supplier_invoice_usd.toLocaleString()}`
    );
  }
  if (parsed.client_name) foundParts.push(`client "${parsed.client_name}"`);
  if (parsed.system_size_kw != null) foundParts.push(`${parsed.system_size_kw} kW`);
  if (parsed.commission_hint_usd != null) {
    foundParts.push(`a $${parsed.commission_hint_usd} commission note`);
  }

  const note =
    foundParts.length > 0
      ? `Found: ${foundParts.join(", ")}. Everything else — your quote to the client, labor, extras, TT fee — still needs your input, since it isn't on the supplier's invoice. Double-check every pre-filled number before saving.`
      : "Couldn't confidently pull any numbers from this PDF — nothing was pre-filled. Enter the details manually below.";

  return NextResponse.json({
    prefill: {
      supplier_invoice_no: parsed.supplier_invoice_no ?? undefined,
      supplier_invoice_usd: parsed.supplier_invoice_usd ?? undefined,
      client_name: parsed.client_name ?? undefined,
      system_size_kw: parsed.system_size_kw ?? undefined,
      // A commission note on the invoice means the amount is embedded in the
      // total, not already netted out of it (confirmed 2026-08-20 against
      // Analyn's actual invoice) — so it's suggested as a discount-based
      // add-back, never silently folded into the total as pure cost.
      commission_mode: parsed.commission_hint_usd != null ? "discount_based" : undefined,
      material_discount_usd: parsed.commission_hint_usd ?? undefined,
    },
    note,
    warnings: parsed.warnings,
  });
}
