// Sanity check — run with: npx tsx src/lib/margin.test.ts
// Validates the formula against Analyn's confirmed numbers before this
// logic goes anywhere near the live app.
import { calculateMargin, formatPHP } from "./margin";

const LIVE_RATE = 61.6343; // USD→PHP, XE, 2026-08-17

const analyn = calculateMargin(
  {
    amount_quoted_php: 630000,
    install_charge_php: 100000,
    install_cost_php: 65000,
    materials_budget_php: 24000,
    materials_costed: false,
    supplier_invoice_usd: 7783,
    fx_rate_paid: null, // force live-rate path
    commission_mode: "baked_in_invoice",
  },
  LIVE_RATE
);

console.log("Analyn margin breakdown:", analyn);
console.log("Margin PHP:", formatPHP(analyn.marginPhp));

const expected = 61300.49;
const diff = Math.abs(analyn.marginPhp - expected);
if (diff > 1) {
  console.error(`MISMATCH: expected ~${expected}, got ${analyn.marginPhp}`);
  process.exit(1);
} else {
  console.log(`✓ Matches confirmed figure (within ₱${diff.toFixed(2)})`);
}

// Delta check: dropping the invoice $160 (7943 -> 7783) should add exactly
// $160 * rate to margin, independent of any formula assumptions.
const before = calculateMargin(
  {
    amount_quoted_php: 630000,
    install_charge_php: 100000,
    install_cost_php: 65000,
    materials_budget_php: 24000,
    materials_costed: false,
    supplier_invoice_usd: 7943,
    fx_rate_paid: null,
    commission_mode: "baked_in_invoice",
  },
  LIVE_RATE
);
const delta = analyn.marginPhp - before.marginPhp;
const expectedDelta = 160 * LIVE_RATE;
console.log(`Delta check: ${delta.toFixed(2)} vs expected ${expectedDelta.toFixed(2)}`);
if (Math.abs(delta - expectedDelta) > 0.01) {
  console.error("DELTA MISMATCH");
  process.exit(1);
}
console.log("✓ Delta check passed");
