import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Group from "@/models/Group";
import User from "@/models/User";
import { calculateGroupBalances } from "@/lib/balance";
import { simplifyDebts } from "@/lib/settle";

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

    // 1. Calculate the raw net balances
    const balancesMap = await calculateGroupBalances(groupId);

    // 2. Greedy settle simplification
    const rawDebts = simplifyDebts(balancesMap);

    // 3. Populate user names, upiIds, avatars
    const memberIds = group.members.map(m => m.userId);
    const users = await User.find({ _id: { $in: memberIds } })
      .select("name email upiId avatarUrl")
      .lean();

    const usersMap = new Map(users.map(u => [u._id.toString(), u]));

    const populatedTransactions = rawDebts.map(debt => {
      const fromUser = usersMap.get(debt.from);
      const toUser = usersMap.get(debt.to);

      return {
        from: {
          _id: debt.from,
          name: fromUser?.name || "Unknown Member",
          email: fromUser?.email || "",
          upiId: fromUser?.upiId || "",
          avatarUrl: fromUser?.avatarUrl || "",
        },
        to: {
          _id: debt.to,
          name: toUser?.name || "Unknown Member",
          email: toUser?.email || "",
          upiId: toUser?.upiId || "",
          avatarUrl: toUser?.avatarUrl || "",
        },
        amount: debt.amount,
      };
    });

    return NextResponse.json({ data: { transactions: populatedTransactions } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to calculate settlements" }, { status: 500 });
  }
}
