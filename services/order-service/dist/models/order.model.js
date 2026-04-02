"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModel = void 0;
const mongoose_1 = require("mongoose");
const OrderSchema = new mongoose_1.default.Schema({
    userId: String,
    items: [{ productId: String, qty: Number, unitPrice: Number }],
    totalAmount: Number,
    status: { type: String, enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED"], default: "PENDING" }
}, { timestamps: true });
exports.OrderModel = mongoose_1.default.models.Order ||
    mongoose_1.default.model("Order", OrderSchema);
//# sourceMappingURL=order.model.js.map