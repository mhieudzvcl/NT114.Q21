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
const mapUrl = {
    auth: process.env.AUTH_SERVICE_URL || "http://auth-service:8081",
    user: process.env.USER_SERVICE_URL || "http://user-service:8082",
    product: process.env.PRODUCT_SERVICE_URL || "http://product-service:8083",
    order: process.env.ORDER_SERVICE_URL || "http://order-service:8084",
    notification: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:8085"
};
let AppService = class AppService {
    async request(method, url, body, auth) {
        const resp = await fetch(url, {
            method,
            headers: {
                "content-type": "application/json",
                ...(auth ? { authorization: auth } : {})
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });
        return resp.json();
    }
    getHealth() {
        return { service: "api-gateway", status: "ok", timestamp: new Date().toISOString() };
    }
    auth(path, body, method = "POST") {
        return this.request(method, `${mapUrl.auth}${path}`, body);
    }
    user(path, auth, body, method = "GET") {
        return this.request(method, `${mapUrl.user}${path}`, body, auth);
    }
    product(path, auth, body, method = "GET") {
        return this.request(method, `${mapUrl.product}${path}`, body, auth);
    }
    order(path, auth, body, method = "GET") {
        return this.request(method, `${mapUrl.order}${path}`, body, auth);
    }
    notification(path, auth, body, method = "GET") {
        return this.request(method, `${mapUrl.notification}${path}`, body, auth);
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map