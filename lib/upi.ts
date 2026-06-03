import type { UpiParams } from "@/types";

/**
 * Build a standard UPI deep-link URL.
 * Format: upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function buildUpiUrl(params: UpiParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.pa) searchParams.set("pa", params.pa);
  if (params.pn) searchParams.set("pn", params.pn);
  if (params.am) searchParams.set("am", params.am.toString());
  if (params.tn) searchParams.set("tn", params.tn);
  searchParams.set("cu", "INR");

  // UPI spec expects spaces to be %20, not + which URLSearchParams produces
  const queryString = searchParams.toString().replace(/\+/g, "%20");
  const finalUrl = `upi://pay?${queryString}`;
  
  console.log("Generated UPI URL:", finalUrl);
  return finalUrl;
}
