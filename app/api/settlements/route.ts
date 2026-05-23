import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Group from "@/models/Group";
import Settlement from "@/models/Settlement";
import Notification from "@/models/Notification";

const settlementSchema = z.object({
  groupId: z.string(),
  payeeId: z.string(),
  amount: z.number().positive(),
  markedManually: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();

    const body = await request.json();
    const validated = settlementSchema.parse(body);

    // Verify both are in the group
    const group = await Group.findOne({
      _id: validated.groupId,
      "members.userId": user._id,
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found or you are not a member" }, { status: 404 });
    }

    const isPayeeMember = group.members.some(m => m.userId.toString() === validated.payeeId);
    if (!isPayeeMember) {
      return NextResponse.json({ error: "Payee is not a member of the group" }, { status: 400 });
    }

    // Create settlement
    const settlement = await Settlement.create({
      groupId: validated.groupId,
      payer: user._id,
      payee: validated.payeeId,
      amount: validated.amount,
      markedManually: validated.markedManually,
    });

    // Notify payee
    await Notification.create({
      userId: validated.payeeId,
      type: "settled",
      message: `${user.name} settled ₹${validated.amount} with you in "${group.name}".`,
      metadata: {
        groupId: group._id.toString(),
        settlementId: settlement._id.toString(),
      },
      isRead: false,
    });

    return NextResponse.json({ data: settlement, message: "Settlement recorded successfully" }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create settlement" }, { status: 500 });
  }
}
