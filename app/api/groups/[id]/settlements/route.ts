import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Group from "@/models/Group";
import Settlement from "@/models/Settlement";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { id: groupId } = await params;

  try {
    await connectDB();

    const group = await Group.findOne({ _id: groupId, "members.userId": user._id });
    if (!group) {
      return NextResponse.json({ error: "Group not found or membership required" }, { status: 404 });
    }

    const settlements = await Settlement.find({ groupId })
      .populate("payer", "name email avatarUrl upiId")
      .populate("payee", "name email avatarUrl upiId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: settlements });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch settlements" }, { status: 500 });
  }
}
