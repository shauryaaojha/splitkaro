import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import { calculateGroupBalances } from "@/lib/balance";
import { simplifyDebts } from "@/lib/settle";
import Group from "@/models/Group";
import Settlement from "@/models/Settlement";
import Notification from "@/models/Notification";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const settlementSchema = z.object({
  groupId: objectIdSchema,
  payerId: objectIdSchema,
  payeeId: objectIdSchema,
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

    const group = await Group.findOne({
      _id: validated.groupId,
      "members.userId": user._id,
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found or you are not a member" }, { status: 404 });
    }

    if (validated.payerId !== user._id.toString()) {
      return NextResponse.json({ error: "Only the payer can mark this settlement as paid" }, { status: 403 });
    }

    if (validated.payerId === validated.payeeId) {
      return NextResponse.json({ error: "Payer and payee cannot be the same member" }, { status: 400 });
    }

    const isPayeeMember = group.members.some(m => m.userId.toString() === validated.payeeId);
    if (!isPayeeMember) {
      return NextResponse.json({ error: "Payee is not a member of the group" }, { status: 400 });
    }

    const balances = await calculateGroupBalances(validated.groupId);
    const currentDebt = simplifyDebts(balances).find(
      debt => debt.from === validated.payerId && debt.to === validated.payeeId
    );

    if (!currentDebt) {
      return NextResponse.json({ error: "No outstanding settlement exists for this payer and payee" }, { status: 400 });
    }

    if (validated.amount - currentDebt.amount > 0.01) {
      return NextResponse.json(
        { error: `Settlement amount exceeds outstanding balance of ₹${currentDebt.amount.toFixed(2)}` },
        { status: 400 }
      );
    }

    const amount = Math.round(validated.amount * 100) / 100;
    const settlement = await Settlement.create({
      groupId: validated.groupId,
      payer: validated.payerId,
      payee: validated.payeeId,
      amount,
      markedManually: validated.markedManually,
    });

    await Notification.create({
      userId: validated.payeeId,
      type: "settled",
      message: `${user.name} settled ₹${amount.toFixed(2)} with you in "${group.name}".`,
      metadata: {
        groupId: group._id.toString(),
        settlementId: settlement._id.toString(),
      },
      isRead: false,
    });

    return NextResponse.json({ data: settlement, message: "Settlement recorded successfully" }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to create settlement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
