import mongoose from "mongoose";
export interface INotification {
    userId?: string;
    channel?: "EMAIL" | "WEBHOOK" | "INAPP";
    title?: string;
    content?: string;
    status?: "QUEUED" | "SENT" | "FAILED";
}
export declare const NotificationModel: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
