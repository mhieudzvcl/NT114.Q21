"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_service_1 = require("./app.service");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const roles_guard_1 = require("./roles.guard");
const roles_decorator_1 = require("./roles.decorator");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    health() {
        return this.appService.getHealth();
    }
    register(body) {
        return this.appService.auth("/api/v1/auth/register", body, "POST");
    }
    login(body) {
        return this.appService.auth("/api/v1/auth/login", body, "POST");
    }
    refresh(body) {
        return this.appService.auth("/api/v1/auth/refresh", body, "POST");
    }
    me(req) {
        return this.appService.user("/api/v1/users/me", req.headers.authorization, undefined, "GET");
    }
    products(req, search) {
        return this.appService.product(`/api/v1/products?search=${search || ""}`, req.headers.authorization, undefined, "GET");
    }
    createProduct(req, body) {
        return this.appService.product("/api/v1/products", req.headers.authorization, body, "POST");
    }
    createOrder(req, body) {
        return this.appService.order("/api/v1/orders", req.headers.authorization, body, "POST");
    }
    updateOrderStatus(req, id, body) {
        return this.appService.order(`/api/v1/orders/${id}/status`, req.headers.authorization, body, "PATCH");
    }
    testNotify(req, body) {
        return this.appService.notification("/api/v1/notifications", req.headers.authorization, body, "POST");
    }
    retryNotify(req, id) {
        return this.appService.notification(`/api/v1/notifications/retry/${id}`, req.headers.authorization, undefined, "POST");
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)("/health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, swagger_1.ApiBody)({ schema: { type: "object", properties: { email: { type: "string", example: "test@gmail.com" }, password: { type: "string", example: "12345678" } } } }),
    (0, common_1.Post)("/auth/register"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "register", null);
__decorate([
    (0, swagger_1.ApiBody)({ schema: { type: "object", properties: { email: { type: "string", example: "test@gmail.com" }, password: { type: "string", example: "12345678" } } } }),
    (0, common_1.Post)("/auth/login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiBody)({ schema: { type: "object", properties: { refreshToken: { type: "string", example: "chuỗi_token_dài_ở_đây" } } } }),
    (0, common_1.Post)("/auth/refresh"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)("/users/me"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Get)("/products"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "products", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({ schema: { type: "object", properties: { sku: { type: "string", example: "SKU-001" }, name: { type: "string", example: "Sản phẩm test" }, price: { type: "number", example: 150000 }, stock: { type: "number", example: 100 }, status: { type: "string", example: "ACTIVE" } } } }),
    (0, common_1.Post)("/products"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createProduct", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({ schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { productId: { type: "string", example: "" }, qty: { type: "number", example: 1 } } } } } } }),
    (0, common_1.Post)("/orders"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Patch)("/orders/:id/status"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({ schema: { type: "object", properties: { userId: { type: "string", example: "gõ_user_id_vào_đây" }, channel: { type: "string", example: "EMAIL" }, title: { type: "string", example: "Thông báo test" }, content: { type: "string", example: "Nội dung push notify" } } } }),
    (0, common_1.Post)("/notifications/test"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "testNotify", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)("/notifications/retry/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "retryNotify", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)("gateway"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map