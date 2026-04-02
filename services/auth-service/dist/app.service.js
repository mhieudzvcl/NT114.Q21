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
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db_1 = require("./db");
const auth_model_1 = require("./models/auth.model");
let AppService = class AppService {
    async onModuleInit() {
        await (0, db_1.connectDb)();
    }
    sign(payload, expiresIn) {
        const secret = process.env.JWT_SECRET || "change_me";
        return jwt.sign(payload, secret, { expiresIn });
    }
    async register(email, password) {
        const exists = await auth_model_1.UserModel.findOne({ email }).lean();
        if (exists)
            return { message: "Email already registered", userId: String(exists._id), email };
        const role = (await auth_model_1.UserModel.countDocuments()) === 0 ? "ADMIN" : "USER";
        const passwordHash = await bcrypt.hash(password, 10);
        const created = await auth_model_1.UserModel.create({ email, passwordHash, role });
        return { userId: String(created._id), email: created.email, role: created.role };
    }
    async login(email, password) {
        const user = await auth_model_1.UserModel.findOne({ email });
        if (!user)
            throw new common_1.UnauthorizedException("Invalid credentials");
        if (!user.passwordHash)
            throw new common_1.UnauthorizedException("Invalid credentials");
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException("Invalid credentials");
        const accessToken = this.sign({ sub: String(user._id), email: user.email ?? email, role: user.role ?? "USER" }, "1h");
        const refreshToken = this.sign({ sub: String(user._id), type: "refresh" }, "7d");
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        await auth_model_1.RefreshModel.deleteMany({ userId: user._id });
        await auth_model_1.RefreshModel.create({ userId: user._id, tokenHash });
        return { accessToken, refreshToken };
    }
    async refresh(refreshToken) {
        const secret = process.env.JWT_SECRET || "change_me";
        const payload = jwt.verify(refreshToken, secret);
        const row = await auth_model_1.RefreshModel.findOne({ userId: payload.sub });
        if (!row)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        if (!row.tokenHash)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        const ok = await bcrypt.compare(refreshToken, row.tokenHash);
        if (!ok)
            throw new common_1.UnauthorizedException("Invalid refresh token");
        const user = await auth_model_1.UserModel.findById(payload.sub);
        if (!user)
            throw new common_1.UnauthorizedException("User not found");
        return { accessToken: this.sign({ sub: String(user._id), email: user.email ?? "", role: user.role ?? "USER" }, "1h") };
    }
    async logout(refreshToken) {
        const secret = process.env.JWT_SECRET || "change_me";
        const payload = jwt.verify(refreshToken, secret);
        await auth_model_1.RefreshModel.deleteMany({ userId: payload.sub });
        return { success: true };
    }
    getHealth() {
        return { service: "auth-service", status: "ok", timestamp: new Date().toISOString() };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map