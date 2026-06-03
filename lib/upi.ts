import type { UpiParams } from "@/types";

/**
 * Sanitize a UPI transaction note (tn) to alphanumeric + spaces only.
 * Non-ASCII chars (e.g. ₹) and special symbols can trigger bank risk-engine
 * rejections even though the UPI spec technically allows any string.
 */
function sanitizeTn(tn: string): string {
  return tn.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 50);
}

/**
 * Build a standard UPI deep-link URL.
 * Format: upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function buildUpiUrl(params: UpiParams): string {
  const searchParams = new URLSearchParams();

  if (params.pa) searchParams.set("pa", params.pa);
  if (params.pn) searchParams.set("pn", params.pn);
  if (params.am) searchParams.set("am", params.am.toString());
  if (params.tn) searchParams.set("tn", sanitizeTn(params.tn));
  searchParams.set("cu", "INR");

  // UPI spec expects spaces to be %20, not + which URLSearchParams produces
  const queryString = searchParams.toString().replace(/\+/g, "%20");
  const finalUrl = `upi://pay?${queryString}`;

  console.log("[UPI] Generated URL:", finalUrl);
  return finalUrl;
}

