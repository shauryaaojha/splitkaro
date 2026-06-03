import type { UpiParams } from "@/types";

/**
 * Format amount cleanly: remove trailing zeros after decimal.
 * e.g. 100.00 → "100", 50.50 → "50.5", 50.25 → "50.25"
 */
function formatAmount(am: string): string {
  const n = parseFloat(am);
  return isNaN(n) ? am : String(n);
}

/**
 * Build a standard UPI deep-link URL.
 * Mandatory: pa, pn
 * Optional:  am (pre-fills amount), cu (omitted — UPI always assumes INR)
 * Omitted:   tn, cu — not needed, reduces risk of bank filter rejections
 */
export function buildUpiUrl(params: UpiParams): string {
  const searchParams = new URLSearchParams();

  if (params.pa) searchParams.set("pa", params.pa);
  if (params.pn) searchParams.set("pn", params.pn);
  if (params.am) searchParams.set("am", formatAmount(params.am));
  // cu (INR) intentionally omitted — it's optional and UPI defaults to INR

  // UPI spec expects spaces to be %20, not + which URLSearchParams produces
  const queryString = searchParams.toString().replace(/\+/g, "%20");
  const finalUrl = `upi://pay?${queryString}`;

  console.log("[UPI] Generated URL:", finalUrl);
  return finalUrl;
}

