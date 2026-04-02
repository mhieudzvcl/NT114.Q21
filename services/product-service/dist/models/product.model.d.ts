import mongoose from "mongoose";
export interface IProduct {
    sku?: string;
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    status?: "ACTIVE" | "INACTIVE";
}
export declare const ProductModel: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
