/**
 * Where the web app is running, for choosing how to launch UPI payments.
 *
 * - `android-app`: inside the SplitKaro APK (Trusted Web Activity). Its launch
 *   URL and UPI return URLs carry `?app=android`, which is remembered for the
 *   tab in sessionStorage because later navigations drop the query.
 * - `android-web`: Chrome or another browser on Android.
 * - `ios`: Safari or the home-screen PWA on iPhone/iPad.
 * - `desktop`: everything else (QR only).
 */
export type Platform = "android-app" | "android-web" | "ios" | "desktop";

const APP_FLAG_KEY = "sk_android_app";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";

  const params = new URLSearchParams(window.location.search);
  const fromApp =
    params.get("app") === "android" || document.referrer.startsWith("android-app://com.splitkaro.app");

  try {
    if (fromApp) sessionStorage.setItem(APP_FLAG_KEY, "1");
    if (sessionStorage.getItem(APP_FLAG_KEY) === "1") return "android-app";
  } catch {
    if (fromApp) return "android-app";
  }

  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android-web";
  // iPadOS reports itself as Mac; touch support tells them apart.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  return "desktop";
}
