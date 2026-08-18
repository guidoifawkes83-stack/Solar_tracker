// Live USD -> PHP rate, no API key required.
// Falls back to a fixed rate only if the API is unreachable, and always
// labels which one was used so it's never silently wrong.

export interface FxResult {
  rate: number;
  source: "live" | "fallback";
  asOf: string | null;
}

const FALLBACK_RATE = 61.6343; // captured 2026-08-17 as a last-resort only

export async function getLiveUsdToPhp(): Promise<FxResult> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      // revalidate hourly — this changes during the day but not by the second
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`FX API returned ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.PHP;
    if (typeof rate !== "number") throw new Error("PHP rate missing from response");
    return { rate, source: "live", asOf: data.time_last_update_utc ?? null };
  } catch {
    return { rate: FALLBACK_RATE, source: "fallback", asOf: null };
  }
}
