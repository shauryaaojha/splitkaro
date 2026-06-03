import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { buildUpiUrl } from "@/lib/upi";

const upiQrSchema = z.object({
  pa: z.string().regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID"),
  pn: z.string().min(1).max(80),
  am: z.coerce.number().positive().max(100000),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = upiQrSchema.safeParse({
    pa: searchParams.get("pa"),
    pn: searchParams.get("pn"),
    am: searchParams.get("am"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid UPI QR parameters" },
      { status: 400 }
    );
  }

  try {
    const upiUrl = buildUpiUrl({
      pa: parsed.data.pa,
      pn: parsed.data.pn,
      am: parsed.data.am.toFixed(2),
    });

    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      margin: 2,
      width: 300,
      color: {
        dark: "#1c1b1b",
        light: "#fcf9f8",
      },
    });

    return NextResponse.json({
      data: {
        qrDataUrl,
        upiUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate UPI QR code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
