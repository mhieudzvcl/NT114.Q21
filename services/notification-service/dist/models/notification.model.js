"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.default.Schema({
    userId: String,
    channel: { type: String, enum: ["EMAIL", "WEBHOOK", "INAPP"] },
    title: String,
    content: String,
    status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], default: "SENT" }
}, { timestamps: true });
exports.NotificationModel = mongoose_1.default.models.Notification ||
    mongoose_1.default.model("Notification", NotificationSchema);
//# sourceMappingURL=notification.model.js.map