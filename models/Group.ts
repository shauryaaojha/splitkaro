import mongoose, { Schema, model, models } from "mongoose";
import type { IGroup } from "@/types";

const GroupMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["food", "trip", "home", "fun", "other"],
      default: "other",
    },
    emoji: { type: String, default: "👥" },
    inviteToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    members: [GroupMemberSchema],
    isArchived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Group =
  (models.Group as mongoose.Model<IGroup>) ??
  model<IGroup>("Group", GroupSchema);

export default Group;
