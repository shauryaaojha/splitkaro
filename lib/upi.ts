import type { UpiParams } from "@/types";

/**
 * Build a standard UPI deep-link URL.
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR
 * tn (transaction note) is intentionally omitted — some bank risk engines
 * reject transactions that contain non-ASCII or unexpected characters in the note.
 */
export function buildUpiUrl(params: UpiParams): string {
  const searchParams = new URLSearchParams();

  if (params.pa) searchParams.set("pa", params.pa);
  if (params.pn) searchParams.set("pn", params.pn);
  if (params.am) searchParams.set("am", params.am.toString());
  searchParams.set("cu", "INR");

  // UPI spec expects spaces to be %20, not + which URLSearchParams produces
  const queryString = searchParams.toString().replace(/\+/g, "%20");
  const finalUrl = `upi://pay?${queryString}`;

  console.log("[UPI] Generated URL:", finalUrl);
  return finalUrl;
}

