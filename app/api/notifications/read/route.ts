import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Notification from "@/models/Notification";

export async function PUT(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();

    await Notification.updateMany(
      { userId: user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
