import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import Notification from "@/models/Notification";

const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().default("other"),
  paidBy: z.string(),
  date: z.string().optional(),
  splits: z.array(
    z.object({
      userId: z.string(),
      share: z.number().nonnegative(),
      splitType: z.enum(["equal", "exact", "percentage"]),
    })
  ).min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { id: groupId } = await params;

  try {
    await connectDB();

    // Verify user is in group
    const group = await Group.findOne({ _id: groupId, "members.userId": user._id });
    if (!group) {
      return NextResponse.json({ error: "Group not found or membership required" }, { status: 404 });
    }

    const expenses = await Expense.find({ groupId, isDeleted: false })
      .populate("paidBy", "name email upiId avatarUrl")
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ data: expenses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { id: groupId } = await params;

  try {
    await connectDB();

    // Verify user is in group
    const group = await Group.findOne({ _id: groupId, "members.userId": user._id });
    if (!group) {
      return NextResponse.json({ error: "Group not found or membership required" }, { status: 404 });
    }

    const body = await request.json();
    const validated = expenseSchema.parse(body);

    // Sum validation with 2 decimal precision
    const splitsSum = validated.splits.reduce((acc, split) => acc + split.share, 0);
    const difference = Math.abs(splitsSum - validated.amount);
    if (difference > 0.05) {
      return NextResponse.json({ error: `Splits sum (${splitsSum}) must equal expense amount (${validated.amount})` }, { status: 400 });
    }

    const expense = await Expense.create({
      groupId,
      description: validated.description,
      amount: validated.amount,
      category: validated.category,
      paidBy: validated.paidBy,
      date: validated.date ? new Date(validated.date) : new Date(),
      splits: validated.splits,
      createdBy: user._id,
    });

    // Create notifications for group members (except creator of notification)
    const membersToNotify = group.members.filter(m => m.userId.toString() !== user._id.toString());
    const notifications = membersToNotify.map(m => ({
      userId: m.userId,
      type: "expense_added",
      message: `${user.name} added "${validated.description}" of ₹${validated.amount} in "${group.name}".`,
      metadata: {
        groupId: group._id.toString(),
        expenseId: expense._id.toString(),
      },
      isRead: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({ data: expense, message: "Expense added successfully" }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to create expense" }, { status: 500 });
  }
}
