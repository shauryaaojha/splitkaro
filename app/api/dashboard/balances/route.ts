import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Group from "@/models/Group";
import User from "@/models/User";
import { calculateGroupBalances } from "@/lib/balance";
import { simplifyDebts } from "@/lib/settle";

export async function GET(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();

    // Find all groups user is a member of
    const groups = await Group.find({
      "members.userId": user._id,
      isArchived: false,
    }).lean();

    // Net balance per user mapping: otherUserId -> amount
    // Positive: they owe user (user is owed), Negative: user owes them (user owes)
    const netPeerBalances = new Map<string, number>();

    let totalOwed = 0;
    let totalOwing = 0;

    for (const group of groups) {
      const groupBalances = await calculateGroupBalances(group._id.toString());
      const groupTransactions = simplifyDebts(groupBalances);

      for (const t of groupTransactions) {
        if (t.from === user._id.toString()) {
          // User owes other user 't.to'
          const prev = netPeerBalances.get(t.to) ?? 0;
          netPeerBalances.set(t.to, prev - t.amount);
        } else if (t.to === user._id.toString()) {
          // Other user 't.from' owes User
          const prev = netPeerBalances.get(t.from) ?? 0;
          netPeerBalances.set(t.from, prev + t.amount);
        }
      }
    }

    // Prepare list of peer balances
    const peerIds = Array.from(netPeerBalances.keys());
    const peers = await User.find({ _id: { $in: peerIds } })
      .select("name email upiId avatarUrl")
      .lean();

    const peersMap = new Map(peers.map(p => [p._id.toString(), p]));

    const balancesList = [];
    for (const [peerId, balance] of netPeerBalances) {
      const peer = peersMap.get(peerId);
      const rounded = Math.round(balance * 100) / 100;

      if (rounded > 0) {
        totalOwed += rounded;
      } else if (rounded < 0) {
        totalOwing += Math.abs(rounded);
      }

      if (rounded !== 0) {
        balancesList.push({
          user: {
            _id: peerId,
            name: peer?.name || "Unknown Member",
            email: peer?.email || "",
            upiId: peer?.upiId || "",
            avatarUrl: peer?.avatarUrl || "",
          },
          amount: rounded,
        });
      }
    }

    const netBalance = Math.round((totalOwed - totalOwing) * 100) / 100;

    return NextResponse.json({
      data: {
        totalOwed: Math.round(totalOwed * 100) / 100,
        totalOwing: Math.round(totalOwing * 100) / 100,
        netBalance,
        balances: balancesList,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to calculate dashboard balances" }, { status: 500 });
  }
}
