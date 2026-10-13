import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Group from "@/models/Group";
import Settlement from "@/models/Settlement";
import Notification from "@/models/Notification";

/**
 * Remove a settlement, which puts the debt back on the balances.
 *
 * - The payee uses it to report a payment they never received (UPI results
 *   come from the payer's phone and can't be verified by the server).
 * - The payer uses it to undo a settlement recorded by mistake.
 * The other party is notified either way.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { sid } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(sid)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();

    const settlement = await Settlement.findById(sid);
    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    const me = user._id.toString();
    const isPayer = settlement.payer.toString() === me;
    const isPayee = settlement.payee.toString() === me;
    if (!isPayer && !isPayee) {
      return NextResponse.json(
        { error: "Only the payer or the payee can remove this settlement" },
        { status: 403 }
      );
    }

    const group = await Group.findById(settlement.groupId).select("name");
    const groupName = group?.name ?? "a group";
    const amount = `₹${settlement.amount.toFixed(2)}`;

    await settlement.deleteOne();

    await Notification.create({
      userId: isPayee ? settlement.payer : settlement.payee,
      type: "settlement_disputed",
      message: isPayee
        ? `${user.name} says they did not receive your ${amount} payment in "${groupName}". The amount is owed again.`
        : `${user.name} undid their ${amount} settlement with you in "${groupName}".`,
      metadata: {
        groupId: settlement.groupId.toString(),
        settlementId: sid,
      },
      isRead: false,
    });

    return NextResponse.json({
      message: isPayee ? "Payment reported as not received" : "Settlement undone",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove settlement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
