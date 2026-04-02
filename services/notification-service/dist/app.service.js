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
const notification_model_1 = require("./models/notification.model");
let AppService = class AppService {
    async onModuleInit() {
        await (0, db_1.connectDb)();
    }
    getHealth() {
        return { service: "notification-service", status: "ok", timestamp: new Date().toISOString() };
    }
    async create(payload) {
        return notification_model_1.NotificationModel.create({ ...payload, status: "SENT" });
    }
    async list(userId) {
        if (!userId)
            return notification_model_1.NotificationModel.find({}).lean();
        return notification_model_1.NotificationModel.find({ userId }).lean();
    }
    async retry(id) {
        const item = await notification_model_1.NotificationModel.findByIdAndUpdate(id, { status: "SENT" }, { new: true }).lean();
        return item || { message: "Not found" };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map