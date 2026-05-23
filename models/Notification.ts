import mongoose, { Schema, model, models } from "mongoose";
import type { INotification } from "@/types";

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "expense_added",
        "settled",
        "group_joined",
        "friend_request",
        "friend_accepted",
      ],
      required: true,
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/** Fast lookup for a user's unread notifications */
NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification =
  (models.Notification as mongoose.Model<INotification>) ??
  model<INotification>("Notification", NotificationSchema);

export default Notification;
