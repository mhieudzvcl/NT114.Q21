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
const product_dto_1 = require("./dto/product.dto");
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    health() { return this.appService.getHealth(); }
    list(search) { return this.appService.list(search || ""); }
    create(body) { return this.appService.create(body); }
    getById(id) { return this.appService.getById(id); }
    update(id, body) { return this.appService.update(id, body); }
    remove(id) { return this.appService.remove(id); }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)("/health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)("/products"),
    (0, swagger_1.ApiOperation)({ summary: "List products" }),
    __param(0, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("/products"),
    (0, swagger_1.ApiOperation)({ summary: "Create product" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("/products/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get product by id" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)("/products/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Update product" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)("/products/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Soft delete product" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "remove", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)("products"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map