import mongoose, { Schema, model, models } from "mongoose";
import type { INotification } from "@/types";
import { pushNotifications } from "@/lib/push";

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

/** Every new in-app notification is also sent to the user's devices as Web Push. */
NotificationSchema.pre("save", function () {
  this.$locals.wasNew = this.isNew;
});

NotificationSchema.post("save", function (doc) {
  // Only fresh notifications are pushed, not later re-saves of the same doc.
  if (doc.$locals.wasNew) pushNotifications([doc]);
});

NotificationSchema.post("insertMany", function (docs: INotification[]) {
  pushNotifications(docs);
});

const Notification =
  (models.Notification as mongoose.Model<INotification>) ??
  model<INotification>("Notification", NotificationSchema);

export default Notification;
