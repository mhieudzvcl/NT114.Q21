"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("./db");
const product_model_1 = require("./models/product.model");
let AppService = class AppService {
    async onModuleInit() {
        await (0, db_1.connectDb)();
        const count = await product_model_1.ProductModel.countDocuments();
        if (count === 0) {
            await product_model_1.ProductModel.create({ sku: "SKU-001", name: "Demo Product", price: 100000, stock: 30, status: "ACTIVE" });
        }
    }
    getHealth() {
        return { service: "product-service", status: "ok", timestamp: new Date().toISOString() };
    }
    async list(search = "") {
        return product_model_1.ProductModel.find({ name: { $regex: search, $options: "i" } }).lean();
    }
    async create(payload) {
        return product_model_1.ProductModel.create(payload);
    }
    async getById(id) {
        const item = await product_model_1.ProductModel.findById(id).lean();
        if (!item)
            throw new common_1.NotFoundException("Product not found");
        return item;
    }
    async update(id, payload) {
        const item = await product_model_1.ProductModel.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!item)
            throw new common_1.NotFoundException("Product not found");
        return item;
    }
    async remove(id) {
        return this.update(id, { status: "INACTIVE" });
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map