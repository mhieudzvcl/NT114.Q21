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
const order_model_1 = require("./models/order.model");
let AppService = class AppService {
    async onModuleInit() {
        await (0, db_1.connectDb)();
    }
    getHealth() {
        return { service: "order-service", status: "ok", timestamp: new Date().toISOString() };
    }
    async create(payload) {
        const items = payload.items.map((i) => ({ ...i, unitPrice: 100000 }));
        const totalAmount = items.reduce((acc, x) => acc + x.qty * x.unitPrice, 0);
        return order_model_1.OrderModel.create({ userId: payload.userId || "u_1", items, totalAmount, status: "PENDING" });
    }
    async getById(id) {
        const order = await order_model_1.OrderModel.findById(id).lean();
        if (!order)
            throw new common_1.NotFoundException("Order not found");
        return order;
    }
    async list(userId) {
        if (!userId)
            return order_model_1.OrderModel.find({}).lean();
        return order_model_1.OrderModel.find({ userId }).lean();
    }
    async updateStatus(id, status) {
        const order = await order_model_1.OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!order)
            throw new common_1.NotFoundException("Order not found");
        return order;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map