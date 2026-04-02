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

  async create(payload: { userId?: string; items: { productId: string; qty: number }[] }) {
    const items = payload.items.map((i) => ({ ...i, unitPrice: 100000 }));
    const totalAmount = items.reduce((acc, x) => acc + x.qty * x.unitPrice, 0);
    return OrderModel.create({ userId: payload.userId || "u_1", items, totalAmount, status: "PENDING" });
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
