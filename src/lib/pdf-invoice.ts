// Best-effort extraction of the fields we can actually get from a supplier
// proforma invoice / quotation PDF, so starting a new project doesn't mean
// retyping numbers that are already sitting on the page.
//
// IMPORTANT — what this can and can't do:
//   - It can read the SUPPLIER side of a deal: their total price, an invoice
//     or model number, the system size, and (if the PDF spells it out) a
//     built-in commission note.
//   - It CANNOT know your quote to the client, labor cost, extras budget, or
//     TT fee — none of that appears on a supplier's invoice, it's your own
//     pricing decision. Those fields are always left for manual entry.
//   - Every extracted field is a best-effort guess from pattern-matching, not
//     a guarantee. A field that can't be found with reasonable confidence is
//     left blank rather than filled with a wrong-looking number — nothing
//     here is ever silently fabricated. Always review before saving.
//
// Different suppliers format invoices completely differently (compare
// Anhui GP's "DDP Price ... Included USD800 commission" style against
// Sunpal's plain "Total EXW Price" table) — so this looks for a handful of
// common patterns rather than assuming one fixed layout.

export interface ParsedInvoice {
  supplier_invoice_no: string | null;
  supplier_invoice_usd: number | null;
  supplier_price_label: string | null; // e.g. "DDP Price", "Total EXW Price" — which line we matched
  client_name: string | null;
  system_size_kw: number | null;
  commission_hint_usd: number | null;
  warnings: string[];
}

function normalize(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const TOTAL_PRICE_KEYWORDS = [
  "Total DDP Price",
  "DDP Price",
  "Total EXW Price",
  "EXW Price",
  "Total FOB Price",
  "FOB Price",
  "Total CIF Price",
  "CIF Price",
  "Grand Total",
  "Total Amount",
  "Total Price",
];

function findTotalPrice(text: string): { amount: number; label: string } | null {
  for (const keyword of TOTAL_PRICE_KEYWORDS) {
    const re = new RegExp(
      `${keyword.replace(/\s+/g, "\\s+")}[^\\n$]{0,40}?(?:US\\$|USD\\s?|\\$)\\s*([\\d,]+\\.\\d{2})`,
      "i"
    );
    const m = text.match(re);
    if (m) {
      const amount = parseAmount(m[1]);
      if (amount != null) return { amount, label: keyword };
    }
  }
  // Last-resort fallback: a line that says "Total" with a dollar amount on it.
  const fallback = text.match(/Total[^\n$]{0,40}?(?:US\$|USD\s?|\$)\s*([\d,]+\.\d{2})/i);
  if (fallback) {
    const amount = parseAmount(fallback[1]);
    if (amount != null) return { amount, label: "Total" };
  }
  return null;
}

function findInvoiceNo(text: string): string | null {
  const patterns = [
    /Invoice\s*No\.?:?\s*([^\n]+?)\s*(?:Date:|$)/i,
    /Quotation\s*No\.?:?\s*([^\n]+?)\s*(?:Date:|$)/i,
    /Quote\s*No\.?:?\s*([^\n]+?)\s*(?:Date:|$)/i,
    /Model:\s*([^\n]+?)\s*(?:Phone:|Email:|Skype:|Website:|Tel:|Date:|$)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}

function findClientName(text: string): string | null {
  const m = text.match(/on\s+behalf\s+of\s+([A-Za-z.,'\- ]+?)(?:\n|$)/i);
  if (m && m[1].trim()) return m[1].trim();
  return null;
}

function findSystemSizeKw(text: string): number | null {
  const direct =
    text.match(/Output\s*Power:?\s*([\d.]+)\s*k?W/i) ??
    text.match(/System\s*Size:?\s*([\d.]+)\s*k?W/i);
  if (direct) {
    const n = Number(direct[1]);
    if (Number.isFinite(n)) return n;
  }
  // Fallback: a panel/module line with a wattage and a quantity, e.g.
  // "Mono 640W Half cell 16 US$80.00" or "SP585M-72H Solar Module ... 585W ... 27 US$69.00".
  const panelLine = text
    .split("\n")
    .find((line) => /(mono|module|panel)/i.test(line) && /\d+\s*W\b/i.test(line));
  if (panelLine) {
    const wattageMatch = panelLine.match(/(\d{2,4})\s*W\b/i);
    const qtyAndPrice = panelLine.match(/(\d{1,4})\s+(?:US)?\$/i);
    if (wattageMatch && qtyAndPrice) {
      const kw = (Number(wattageMatch[1]) * Number(qtyAndPrice[1])) / 1000;
      if (Number.isFinite(kw) && kw > 0) return Math.round(kw * 100) / 100;
    }
  }
  return null;
}

function findCommissionHint(text: string): number | null {
  const m = text.match(/(?:US\$|USD\s?|\$)?\s*([\d,]+(?:\.\d+)?)\s*commission/i);
  if (m) return parseAmount(m[1]);
  return null;
}

export function parseInvoiceText(rawText: string): ParsedInvoice {
  const text = normalize(rawText);
  const warnings: string[] = [];

  const total = findTotalPrice(text);
  if (!total) warnings.push("Couldn't find a total price on this PDF — enter it manually.");

  const invoiceNo = findInvoiceNo(text);
  const clientName = findClientName(text);
  const systemSizeKw = findSystemSizeKw(text);
  const commissionHint = findCommissionHint(text);

  return {
    supplier_invoice_no: invoiceNo,
    supplier_invoice_usd: total?.amount ?? null,
    supplier_price_label: total?.label ?? null,
    client_name: clientName,
    system_size_kw: systemSizeKw,
    commission_hint_usd: commissionHint,
    warnings,
  };
}
