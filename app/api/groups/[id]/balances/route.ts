import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Group from "@/models/Group";
import User from "@/models/User";
import { calculateGroupBalances } from "@/lib/balance";

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

    // Calculate balances
    const balancesMap = await calculateGroupBalances(groupId);

    // Get all group members' details to populate names, upiIds, avatars
    const memberIds = group.members.map(m => m.userId);
    const users = await User.find({ _id: { $in: memberIds } })
      .select("name email upiId avatarUrl")
      .lean();

    const usersMap = new Map(users.map(u => [u._id.toString(), u]));

    const balanceMatrix = group.members.map(member => {
      const uId = member.userId.toString();
      const userDetails = usersMap.get(uId);
      const netBalance = balancesMap.get(uId) ?? 0;
      return {
        user: {
          _id: uId,
          name: userDetails?.name || "Unknown Member",
          email: userDetails?.email || "",
          upiId: userDetails?.upiId || "",
          avatarUrl: userDetails?.avatarUrl || "",
        },
        amount: netBalance,
      };
    });

    return NextResponse.json({ data: balanceMatrix });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch balances" }, { status: 500 });
  }
}
