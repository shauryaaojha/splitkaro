import mongoose, { Schema, model, models } from "mongoose";

export interface IUnsubscribe {
  email: string;
  createdAt: Date;
}

const UnsubscribeSchema = new Schema<IUnsubscribe>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Unsubscribe =
  (models.Unsubscribe as mongoose.Model<IUnsubscribe>) ??
  model<IUnsubscribe>("Unsubscribe", UnsubscribeSchema);

export default Unsubscribe;
