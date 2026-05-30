import type { UpiParams } from "@/types";

/**
 * Build a standard UPI deep-link URL.
 * Format: upi://pay?pa=...&pn=...&am=...&tn=...&cu=INR
 */
export function buildUpiUrl(params: UpiParams): string {
  const qs = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am,
    tn: params.tn,
    cu: "INR",
  });
  return `upi://pay?${qs.toString()}`;
}

/**
 * Build a Google Pay payment URL.
 */
export function buildGPayUrl(params: UpiParams): string {
  const qs = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am,
    tn: params.tn,
    cu: "INR",
  });
  return `tez://upi/pay?${qs.toString()}`;
}

/**
 * Build a PhonePe payment URL.
 */
export function buildPhonePeUrl(params: UpiParams): string {
  const qs = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am,
    tn: params.tn,
    cu: "INR",
  });
  return `phonepe://pay?${qs.toString()}`;
}

/**
 * Build a Paytm payment URL.
 */
export function buildPaytmUrl(params: UpiParams): string {
  const qs = new URLSearchParams({
    pa: params.pa,
    pn: params.pn,
    am: params.am,
    tn: params.tn,
    cu: "INR",
  });
  return `paytmmp://upi/pay?${qs.toString()}`;
}
