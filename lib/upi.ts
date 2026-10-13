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


/** Package name of the SplitKaro Android app (Trusted Web Activity). */
export const ANDROID_APP_PACKAGE = "com.splitkaro.app";

/**
 * Android Chrome blocks plain upi:// navigations, but resolves intent:// URLs
 * natively and shows the system chooser of installed UPI apps.
 */
export function buildAndroidIntentUrl(upiUrl: string): string {
  const query = upiUrl.replace(/^upi:\/\/pay\?/, "");
  return `intent://pay?${query}#Intent;scheme=upi;end`;
}

/**
 * Launch the SplitKaro app's native UPI bridge (UpiPayActivity), which opens
 * the UPI app with startActivityForResult and reopens `returnPath` with
 * upi_status / upi_txn / upi_ref query params. Only used when the page is
 * already running inside that app, so the target is always installed.
 */
export function buildAppBridgeUrl(upiUrl: string, returnPath: string): string {
  const query = new URLSearchParams({ upi: upiUrl, return: returnPath }).toString();
  return `intent://pay?${query}#Intent;scheme=splitkaro-upi;package=${ANDROID_APP_PACKAGE};end`;
}

/**
 * iOS has no app chooser for upi://, so each UPI app gets its own button.
 * These are the schemes the apps register on iOS; `upi://` opens whichever
 * app claimed it.
 */
export const IOS_UPI_APPS = [
  { id: "gpay", name: "Google Pay", prefix: "gpay://upi/pay?" },
  { id: "phonepe", name: "PhonePe", prefix: "phonepe://pay?" },
  { id: "paytm", name: "Paytm", prefix: "paytmmp://pay?" },
  { id: "other", name: "Other UPI app", prefix: "upi://pay?" },
] as const;

export function buildIosAppUrl(upiUrl: string, prefix: string): string {
  return prefix + upiUrl.replace(/^upi:\/\/pay\?/, "");
}
