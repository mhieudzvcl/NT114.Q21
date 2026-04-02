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
export declare const OrderModel: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
