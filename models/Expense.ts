import mongoose, { Schema, model, models } from "mongoose";
import type { IExpense } from "@/types";

const ExpenseSplitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    share: { type: Number, required: true },
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage"],
      default: "equal",
    },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: "other" },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    splits: { type: [ExpenseSplitSchema], required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

/** Compound index for common query: all active expenses in a group */
ExpenseSchema.index({ groupId: 1, isDeleted: 1 });

const Expense =
  (models.Expense as mongoose.Model<IExpense>) ??
  model<IExpense>("Expense", ExpenseSchema);

export default Expense;
