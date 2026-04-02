import mongoose from "mongoose";

export interface INotification {
  userId?: string;
  channel?: "EMAIL" | "WEBHOOK" | "INAPP";
  title?: string;
  content?: string;
  status?: "QUEUED" | "SENT" | "FAILED";
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId: String,
    channel: { type: String, enum: ["EMAIL", "WEBHOOK", "INAPP"] },
    title: String,
    content: String,
    status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], default: "SENT" }
  },
  { timestamps: true }
);

export const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);
