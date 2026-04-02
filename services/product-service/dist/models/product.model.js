"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const ProductSchema = new mongoose_1.default.Schema({
    sku: { type: String, unique: true, index: true },
    name: String,
    description: String,
    price: Number,
    stock: Number,
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true });
exports.ProductModel = mongoose_1.default.models.Product ||
    mongoose_1.default.model("Product", ProductSchema);
//# sourceMappingURL=product.model.js.map