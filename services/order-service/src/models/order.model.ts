import mongoose from "mongoose";

export interface IOrderItem {
  productId?: string;
  qty?: number;
  unitPrice?: number;
}

export interface IOrder {
  userId?: string;
  items?: IOrderItem[];
  totalAmount?: number;
  status?: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
}

const OrderSchema = new mongoose.Schema<IOrder>(
  {
    userId: String,
    items: [{ productId: String, qty: Number, unitPrice: Number }],
    totalAmount: Number,
    status: { type: String, enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED"], default: "PENDING" }
  },
  { timestamps: true }
);

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);
