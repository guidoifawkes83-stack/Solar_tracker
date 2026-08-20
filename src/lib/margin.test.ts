// Sanity check — run with: npx tsx src/lib/margin.test.ts
// Validates the formula against Analyn's confirmed numbers, straight off her
// actual supplier proforma invoice (GPMK-PH0813-2026N), before this logic
// goes anywhere near the live app.
import { calculateMargin, formatPHP } from "./margin";

// Harold's own manual breakdown (2026-08-20), from the proforma invoice which
// states the $7,783 DDP price is "Included USD800 commission" — i.e. the
// $800 is embedded in that total, not already netted out of it. True
// material cost is $7,783 - $800 = $6,983 x 62 = PHP 432,946.
//   630,000 (contract) - 432,946 (material) - 65,000 (labor)
//   - 20,000 (extra materials) - 5,000 (TT) = PHP 107,054
const analyn = calculateMargin(
  {
    amount_quoted_php: 630000,
    install_charge_php: 100000,
    install_cost_php: 65000,
    materials_budget_php: 20000,
    materials_costed: false,
    supplier_invoice_usd: 7783,
    fx_rate_paid: 62, // Harold's own reference rate for this check
    commission_mode: "discount_based",
    material_discount_usd: 800,
    supplier_discount_usd: 0,
    tt_fee_php: 5000,
  },
  62
);

console.log("Analyn margin breakdown:", analyn);
console.log("Margin PHP:", formatPHP(analyn.marginPhp));

const expected = 107054;
const diff = Math.abs(analyn.marginPhp - expected);
if (diff > 0.01) {
  console.error(`MISMATCH: expected ${expected}, got ${analyn.marginPhp}`);
  process.exit(1);
} else {
  console.log(`✓ Matches Harold's hand calculation exactly (within ₱${diff.toFixed(2)})`);
}

// Sanity check: at the live rate instead of the pegged 62, only the
// USD-denominated lines (supplier cost and the $800 add-back) should move —
// everything else (PHP-only lines) stays fixed.
const liveRate = 61.806412;
const atLive = calculateMargin(
  {
    amount_quoted_php: 630000,
    install_charge_php: 100000,
    install_cost_php: 65000,
    materials_budget_php: 20000,
    materials_costed: false,
    supplier_invoice_usd: 7783,
    fx_rate_paid: null, // force live-rate path
    commission_mode: "discount_based",
    material_discount_usd: 800,
    supplier_discount_usd: 0,
    tt_fee_php: 5000,
  },
  liveRate
);
console.log(`At live rate ${liveRate}: ${formatPHP(atLive.marginPhp)}`);
console.log("✓ Live-rate path runs without error");

// Emerald — same commission structure as Analyn, confirmed against Harold's
// own breakdown (2026-08-20): $9,682 DDP price "included" the $800
// commission, so true material cost is $9,682 - $800 = $8,882 x 62.
const emerald = calculateMargin(
  {
    amount_quoted_php: 750000,
    install_charge_php: 120000,
    install_cost_php: 78000,
    materials_budget_php: 24000,
    materials_costed: false,
    supplier_invoice_usd: 9682,
    fx_rate_paid: 62,
    commission_mode: "discount_based",
    material_discount_usd: 800,
    supplier_discount_usd: 0,
    tt_fee_php: 5000,
  },
  62
);
console.log("Emerald margin breakdown:", emerald);
const emeraldExpected = 92316;
const emeraldDiff = Math.abs(emerald.marginPhp - emeraldExpected);
if (emeraldDiff > 0.01) {
  console.error(`EMERALD MISMATCH: expected ${emeraldExpected}, got ${emerald.marginPhp}`);
  process.exit(1);
} else {
  console.log(`✓ Emerald matches (within ₱${emeraldDiff.toFixed(2)})`);
}
