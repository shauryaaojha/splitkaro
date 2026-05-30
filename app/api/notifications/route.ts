import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Notification from "@/models/Notification";

export async function GET(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = parseInt(searchParams.get("skip") || "0", 10);

  try {
    await connectDB();

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: notifications,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
