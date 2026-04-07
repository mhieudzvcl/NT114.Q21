import mongoose from "mongoose";

export interface IProduct {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: "ACTIVE" | "INACTIVE";
  category?: string;
  imageUrl?: string;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    sku: { type: String, unique: true, index: true },
    name: String,
    description: String,
    price: Number,
    stock: Number,
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    category: String,
    imageUrl: String
  },
  { timestamps: true }
);

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);
