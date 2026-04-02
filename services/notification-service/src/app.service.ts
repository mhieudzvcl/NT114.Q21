import { Injectable, OnModuleInit } from "@nestjs/common";
import { connectDb } from "./db";

import { NotificationModel } from "./models/notification.model";

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
  }

  getHealth() {
    return { service: "notification-service", status: "ok", timestamp: new Date().toISOString() };
  }

  async create(payload: { userId: string; channel: "EMAIL" | "WEBHOOK" | "INAPP"; title: string; content: string }) {
    return NotificationModel.create({ ...payload, status: "SENT" });
  }

  async list(userId?: string) {
    if (!userId) return NotificationModel.find({}).lean();
    return NotificationModel.find({ userId }).lean();
  }

  async retry(id: string) {
    const item = await NotificationModel.findByIdAndUpdate(id, { status: "SENT" }, { new: true }).lean();
    return item || { message: "Not found" };
  }
}
