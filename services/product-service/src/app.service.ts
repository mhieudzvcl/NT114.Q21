import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { connectDb } from "./db";

import { ProductModel, IProduct } from "./models/product.model";

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      await ProductModel.create({ sku: "SKU-001", name: "Demo Product", price: 100000, stock: 30, status: "ACTIVE" });
    }
  }

  getHealth() {
    return { service: "product-service", status: "ok", timestamp: new Date().toISOString() };
  }

  async list(search = "") {
    return ProductModel.find({ name: { $regex: search, $options: "i" } }).lean();
  }

  async create(payload: { sku: string; name: string; description?: string; price: number; stock: number; status: "ACTIVE" | "INACTIVE" }) {
    return ProductModel.create(payload);
  }

  async getById(id: string) {
    const item = await ProductModel.findById(id).lean();
    if (!item) throw new NotFoundException("Product not found");
    return item;
  }

  async update(id: string, payload: Partial<IProduct>) {
    const item = await ProductModel.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!item) throw new NotFoundException("Product not found");
    return item;
  }

  async remove(id: string) {
    return this.update(id, { status: "INACTIVE" });
  }
}
