import { Injectable } from "@nestjs/common";

const mapUrl = {
  auth: process.env.AUTH_SERVICE_URL || "http://auth-service:8081",
  user: process.env.USER_SERVICE_URL || "http://user-service:8082",
  product: process.env.PRODUCT_SERVICE_URL || "http://product-service:8083",
  order: process.env.ORDER_SERVICE_URL || "http://order-service:8084",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:8085"
};

@Injectable()
export class AppService {
  private async request(method: string, url: string, body?: unknown, auth?: string) {
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

  auth(path: string, body?: unknown, method = "POST") {
    return this.request(method, `${mapUrl.auth}${path}`, body);
  }

  user(path: string, auth?: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.user}${path}`, body, auth);
  }

  product(path: string, auth?: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.product}${path}`, body, auth);
  }

  order(path: string, auth?: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.order}${path}`, body, auth);
  }

  notification(path: string, auth?: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.notification}${path}`, body, auth);
  }
}
