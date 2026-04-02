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
const profile_model_1 = require("./models/profile.model");
let AppService = class AppService {
    async onModuleInit() {
        await (0, db_1.connectDb)();
        const count = await profile_model_1.ProfileModel.countDocuments();
        if (count === 0)
            await profile_model_1.ProfileModel.create({ userId: "u_1", fullName: "Admin User" });
    }
    getHealth() {
        return { service: "user-service", status: "ok", timestamp: new Date().toISOString() };
    }
    async getMe(userId = "u_1") {
        return profile_model_1.ProfileModel.findOne({ userId }).lean();
    }
    async getById(id) {
        const found = await profile_model_1.ProfileModel.findById(id).lean();
        if (!found)
            throw new common_1.NotFoundException("Profile not found");
        return found;
    }
    async update(id, payload) {
        const updated = await profile_model_1.ProfileModel.findByIdAndUpdate(id, payload, { new: true }).lean();
        if (!updated)
            throw new common_1.NotFoundException("Profile not found");
        return updated;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map