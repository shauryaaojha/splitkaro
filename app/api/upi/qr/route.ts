import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { buildUpiUrl } from "@/lib/upi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pa = searchParams.get("pa");
  const pn = searchParams.get("pn");
  const am = searchParams.get("am");
  const tn = searchParams.get("tn");

  if (!pa || !pn) {
    return NextResponse.json({ error: "Missing required query parameters: pa (UPI ID) and pn (Payee Name)" }, { status: 400 });
  }

  try {
    const upiUrl = buildUpiUrl({
      pa,
      pn,
      am: am || "",
      tn: tn || "SplitKaro Payment",
    });

    // Generate Base64 Data URL for the QR code
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate UPI QR code" }, { status: 500 });
  }
}
