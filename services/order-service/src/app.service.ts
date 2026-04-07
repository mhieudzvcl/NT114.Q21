import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { connectDb } from "./db";

import { OrderModel } from "./models/order.model";

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
  }

  getHealth() {
    return { service: "order-service", status: "ok", timestamp: new Date().toISOString() };
  }

  private async sendNotification(userId: string, orderId: string, totalAmount: number) {
    try {
      const baseUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:8085";
      await fetch(`${baseUrl}/api/v1/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          channel: "INAPP",
          title: "🛒 Đặt hàng thành công!",
          content: `Đơn hàng #${orderId} đã được tạo. Tổng tiền: ${totalAmount.toLocaleString("vi-VN")}đ`
        })
      });
    } catch (err) {
      console.error("[order-service] Failed to send notification:", err);
    }
  }

  async create(payload: { userId?: string; items: { productId: string; qty: number }[] }) {
    const items = payload.items.map((i) => ({ ...i, unitPrice: 100000 }));
    const totalAmount = items.reduce((acc, x) => acc + x.qty * x.unitPrice, 0);
    const order = await OrderModel.create({ userId: payload.userId || "u_1", items, totalAmount, status: "PENDING" });
    // Fire-and-forget: gửi thông báo sau khi tạo đơn, không block luồng chính
    this.sendNotification(String(order.userId), String(order._id), order.totalAmount);
    return order;
  }

  async getById(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async list(userId?: string) {
    if (!userId) return OrderModel.find({}).lean();
    return OrderModel.find({ userId }).lean();
  }

  async updateStatus(id: string, status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED") {
    const order = await OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }
}
