import mongoose, { Schema, model, models } from "mongoose";
import type { IUser } from "@/types";

const OtpSchema = new Schema(
  {
    hash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const FriendRequestSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    upiId: { type: String, default: "" },
    avatarUrl: { type: String },
    otp: { type: OtpSchema },
    pendingEmail: { type: String },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [FriendRequestSchema],
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        keys: { type: Schema.Types.Mixed },
        expirationTime: { type: Number },
        createdAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        // Never leak OTP data in API responses
        delete ret.otp;
        return ret;
      },
    },
  }
);

const User =
  (models.User as mongoose.Model<IUser>) ?? model<IUser>("User", UserSchema);

export default User;
