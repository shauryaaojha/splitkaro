import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { authMiddleware } from "@/lib/middleware";
import Expense from "@/models/Expense";
import Group from "@/models/Group";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID");

const expenseEditSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().default("other"),
  paidBy: objectIdSchema,
  date: z.string().optional(),
  splits: z.array(
    z.object({
      userId: objectIdSchema,
      share: z.number().nonnegative(),
      splitType: z.enum(["equal", "exact", "percentage"]),
    })
  ).min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { id: groupId, eid: expenseId } = await params;

  try {
    await connectDB();

    const group = await Group.findOne({ _id: groupId, "members.userId": user._id });
    if (!group) {
      return NextResponse.json({ error: "Group not found or membership required" }, { status: 404 });
    }

    const expense = await Expense.findOne({ _id: expenseId, groupId, isDeleted: false })
      .populate("paidBy", "name email upiId avatarUrl")
      .lean();

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ data: expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { id: groupId, eid: expenseId } = await params;

  try {
    await connectDB();

    const group = await Group.findOne({ _id: groupId, "members.userId": user._id });
    if (!group) {
      return NextResponse.json({ error: "Group not found or membership required" }, { status: 404 });
    }

    const expense = await Expense.findOne({ _id: expenseId, groupId, isDeleted: false });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Determine authorization rules:
    // 1. Group admins can edit anytime.
    // 2. Regular users can edit ONLY if they created the expense AND it's within 24 hours of creation.
    const userMember = group.members.find(m => m.userId.toString() === user._id.toString());
    const isAdmin = userMember?.role === "admin";
    const isCreator = expense.createdBy.toString() === user._id.toString();

    if (!isAdmin) {
      if (!isCreator) {
        return NextResponse.json({ error: "Unauthorized. Only the expense creator or group admin can edit this expense." }, { status: 403 });
      }

      const hrsSinceCreation = (Date.now() - new Date(expense.createdAt).getTime()) / (1000 * 60 * 60);
      if (hrsSinceCreation > 24) {
        return NextResponse.json({ error: "Unauthorized. Non-admin users can only edit expenses within 24 hours." }, { status: 403 });
      }
    }

    const body = await request.json();
    const validated = expenseEditSchema.parse(body);

    const memberIds = new Set(group.members.map(m => m.userId.toString()));
    if (!memberIds.has(validated.paidBy)) {
      return NextResponse.json({ error: "Paid-by user must be a group member" }, { status: 400 });
    }

    const hasNonMemberSplit = validated.splits.some(split => !memberIds.has(split.userId));
    if (hasNonMemberSplit) {
      return NextResponse.json({ error: "All split participants must be group members" }, { status: 400 });
    }

    const splitUserIds = new Set(validated.splits.map(split => split.userId));
    if (splitUserIds.size !== validated.splits.length) {
      return NextResponse.json({ error: "Each group member can appear only once in splits" }, { status: 400 });
    }

    // Sum validation
    const splitsSum = validated.splits.reduce((acc, split) => acc + split.share, 0);
    const difference = Math.abs(splitsSum - validated.amount);
    if (difference > 0.05) {
      return NextResponse.json({ error: `Splits sum (${splitsSum}) must equal expense amount (${validated.amount})` }, { status: 400 });
    }

    expense.description = validated.description;
    expense.amount = validated.amount;
    expense.category = validated.category;
    expense.paidBy = validated.paidBy;
    if (validated.date) {
      expense.date = new Date(validated.date);
    }
    expense.splits = validated.splits;

    await expense.save();

    return NextResponse.json({ data: expense, message: "Expense updated successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to update expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  const { id: groupId, eid: expenseId } = await params;

  try {
    await connectDB();

    const group = await Group.findOne({ _id: groupId, "members.userId": user._id });
    if (!group) {
      return NextResponse.json({ error: "Group not found or membership required" }, { status: 404 });
    }

    const expense = await Expense.findOne({ _id: expenseId, groupId, isDeleted: false });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Delete rule: Only group admin or creator can delete.
    const userMember = group.members.find(m => m.userId.toString() === user._id.toString());
    const isAdmin = userMember?.role === "admin";
    const isCreator = expense.createdBy.toString() === user._id.toString();

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Unauthorized. Only the expense creator or group admin can delete this expense." }, { status: 403 });
    }

    expense.isDeleted = true;
    expense.deletedAt = new Date();
    await expense.save();

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
