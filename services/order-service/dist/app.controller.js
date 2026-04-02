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
const order_dto_1 = require("./dto/order.dto");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    health() { return this.appService.getHealth(); }
    create(body) { return this.appService.create(body); }
    getById(id) { return this.appService.getById(id); }
    list(userId) { return this.appService.list(userId); }
    updateStatus(id, body) { return this.appService.updateStatus(id, body.status); }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)("/health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Post)("/orders"),
    (0, swagger_1.ApiOperation)({ summary: "Create order" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("/orders/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get order by id" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)("/orders"),
    (0, swagger_1.ApiOperation)({ summary: "List orders" }),
    __param(0, (0, common_1.Query)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)("/orders/:id/status"),
    (0, swagger_1.ApiOperation)({ summary: "Update order status" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, order_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updateStatus", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)("orders"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map