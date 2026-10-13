import mongoose, { Schema, model, models } from "mongoose";
import type { ISettlement } from "@/types";

const SettlementSchema = new Schema<ISettlement>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    payer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    payee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    markedManually: { type: Boolean, default: true },
    method: { type: String, enum: ["manual", "upi_app"], default: "manual" },
    upiStatus: { type: String, enum: ["SUCCESS", "SUBMITTED"] },
    upiTxnId: { type: String, trim: true, maxlength: 64 },
    upiTxnRef: { type: String, trim: true, maxlength: 64 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/** Compound index for fetching all settlements in a group */
SettlementSchema.index({ groupId: 1, payer: 1, payee: 1 });

/** One settlement per UPI transaction, so a reloaded return URL can't record it twice */
SettlementSchema.index(
  { payer: 1, upiTxnId: 1 },
  { unique: true, partialFilterExpression: { upiTxnId: { $type: "string" } } }
);

const Settlement =
  (models.Settlement as mongoose.Model<ISettlement>) ??
  model<ISettlement>("Settlement", SettlementSchema);

export default Settlement;
