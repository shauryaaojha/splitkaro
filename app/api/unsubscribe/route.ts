import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Unsubscribe from "@/models/Unsubscribe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function recordUnsubscribe(email: string): Promise<boolean> {
  if (!email || !EMAIL_RE.test(email)) return false;
  await connectDB();
  await Unsubscribe.updateOne(
    { email: email.toLowerCase() },
    { $setOnInsert: { email: email.toLowerCase() } },
    { upsert: true }
  );
  return true;
}

/**
 * One-click unsubscribe (RFC 8058). Gmail/Yahoo POST here directly when the
 * user clicks "Unsubscribe" in the mail client, with no further interaction.
 */
export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  await recordUnsubscribe(email);
  // Always 200 — must not leak whether the address exists.
  return new NextResponse(null, { status: 200 });
}

/**
 * Friendly confirmation page for users who click the link in the email body.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  const ok = await recordUnsubscribe(email);

  const message = ok
    ? "You've been unsubscribed. You won't receive any more SplitKaro invite emails."
    : "We couldn't process that unsubscribe link.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Unsubscribe · SplitKaro</title></head>
<body style="margin:0;padding:0;background-color:#fcf9f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:48px auto;background:#ffffff;border:2px solid #1c1b1b;border-radius:16px;overflow:hidden;">
    <tr><td style="background-color:#aa3000;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Split<span style="font-weight:400;">Karo</span></h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0;font-size:15px;color:#1c1b1b;">${message}</p>
    </td></tr>
  </table>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
