from pathlib import Path


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


AUTH_PACKAGE = """{
  "name": "auth-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "test": "echo \\"No tests yet\\""
  },
  "dependencies": {
    "@nestjs/common": "^10.4.8",
    "@nestjs/core": "^10.4.8",
    "@nestjs/platform-express": "^10.4.8",
    "@nestjs/swagger": "^7.4.2",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "jsonwebtoken": "^9.0.2",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.8",
    "@nestjs/schematics": "^10.1.4",
    "@nestjs/testing": "^10.4.8",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.10.2",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}
"""


AUTH_SERVICE = """import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

type User = { id: string; email: string; password: string; role: "ADMIN" | "USER" };

@Injectable()
export class AppService {
  private users: User[] = [];
  private refreshStore = new Map<string, string>();

  private sign(payload: Record<string, unknown>, expiresIn: string) {
    const secret = process.env.JWT_SECRET || "change_me";
    return jwt.sign(payload, secret, { expiresIn });
  }

  register(email: string, password: string) {
    const exists = this.users.find((u) => u.email === email);
    if (exists) {
      return { message: "Email already registered", userId: exists.id, email: exists.email };
    }
    const user: User = {
      id: `u_${this.users.length + 1}`,
      email,
      password,
      role: this.users.length === 0 ? "ADMIN" : "USER"
    };
    this.users.push(user);
    return { userId: user.id, email: user.email, role: user.role };
  }

  login(email: string, password: string) {
    const user = this.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const accessToken = this.sign({ sub: user.id, email: user.email, role: user.role }, "1h");
    const refreshToken = this.sign({ sub: user.id, type: "refresh" }, "7d");
    this.refreshStore.set(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  refresh(refreshToken: string) {
    const secret = process.env.JWT_SECRET || "change_me";
    const payload = jwt.verify(refreshToken, secret) as { sub: string };
    const stored = this.refreshStore.get(payload.sub);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const user = this.users.find((u) => u.id === payload.sub);
    if (!user) throw new UnauthorizedException("User not found");
    return {
      accessToken: this.sign({ sub: user.id, email: user.email, role: user.role }, "1h")
    };
  }

  logout(refreshToken: string) {
    const secret = process.env.JWT_SECRET || "change_me";
    const payload = jwt.verify(refreshToken, secret) as { sub: string };
    this.refreshStore.delete(payload.sub);
    return { success: true };
  }

  getHealth() {
    return { service: "auth-service", status: "ok", timestamp: new Date().toISOString() };
  }
}
"""


AUTH_CONTROLLER = """import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("auth")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  getHealth() {
    return this.appService.getHealth();
  }

  @Post("/auth/register")
  @ApiOperation({ summary: "Register user" })
  register(@Body() body: { email: string; password: string }) {
    return this.appService.register(body.email, body.password);
  }

  @Post("/auth/login")
  @ApiOperation({ summary: "Login user" })
  login(@Body() body: { email: string; password: string }) {
    return this.appService.login(body.email, body.password);
  }

  @Post("/auth/refresh")
  @ApiBearerAuth()
  refresh(@Body() body: { refreshToken: string }) {
    return this.appService.refresh(body.refreshToken);
  }

  @Post("/auth/logout")
  @ApiBearerAuth()
  logout(@Body() body: { refreshToken: string }) {
    return this.appService.logout(body.refreshToken);
  }
}
"""


CRUD_CONTROLLER = """import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("__TAG__")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health() {
    return this.appService.getHealth();
  }

  __ROUTES__
}
"""


USER_SERVICE = """import { Injectable, NotFoundException } from "@nestjs/common";

type Profile = { id: string; userId: string; fullName: string; phone?: string; avatarUrl?: string };

@Injectable()
export class AppService {
  private profiles: Profile[] = [{ id: "p_1", userId: "u_1", fullName: "Admin User" }];

  getHealth() {
    return { service: "user-service", status: "ok", timestamp: new Date().toISOString() };
  }

  getMe(userId = "u_1") {
    return this.profiles.find((p) => p.userId === userId) || null;
  }

  getById(id: string) {
    const found = this.profiles.find((p) => p.id === id);
    if (!found) throw new NotFoundException("Profile not found");
    return found;
  }

  update(id: string, payload: Partial<Profile>) {
    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx < 0) throw new NotFoundException("Profile not found");
    this.profiles[idx] = { ...this.profiles[idx], ...payload };
    return this.profiles[idx];
  }
}
"""


PRODUCT_SERVICE = """import { Injectable, NotFoundException } from "@nestjs/common";

type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
};

@Injectable()
export class AppService {
  private products: Product[] = [
    { id: "pr_1", sku: "SKU-001", name: "Demo Product", price: 100000, stock: 30, status: "ACTIVE" }
  ];

  getHealth() {
    return { service: "product-service", status: "ok", timestamp: new Date().toISOString() };
  }

  list(search = "") {
    return this.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  create(payload: Omit<Product, "id">) {
    const item = { id: `pr_${this.products.length + 1}`, ...payload };
    this.products.push(item);
    return item;
  }

  getById(id: string) {
    const item = this.products.find((p) => p.id === id);
    if (!item) throw new NotFoundException("Product not found");
    return item;
  }

  update(id: string, payload: Partial<Product>) {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx < 0) throw new NotFoundException("Product not found");
    this.products[idx] = { ...this.products[idx], ...payload };
    return this.products[idx];
  }

  remove(id: string) {
    const item = this.getById(id);
    item.status = "INACTIVE";
    return item;
  }
}
"""


ORDER_SERVICE = """import { Injectable, NotFoundException } from "@nestjs/common";

type Item = { productId: string; qty: number; unitPrice: number };
type Order = {
  id: string;
  userId: string;
  items: Item[];
  totalAmount: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
};

@Injectable()
export class AppService {
  private orders: Order[] = [];

  getHealth() {
    return { service: "order-service", status: "ok", timestamp: new Date().toISOString() };
  }

  create(payload: { userId?: string; items: { productId: string; qty: number }[] }) {
    const items = payload.items.map((i) => ({ ...i, unitPrice: 100000 }));
    const totalAmount = items.reduce((acc, x) => acc + x.qty * x.unitPrice, 0);
    const order: Order = {
      id: `od_${this.orders.length + 1}`,
      userId: payload.userId || "u_1",
      items,
      totalAmount,
      status: "PENDING"
    };
    this.orders.push(order);
    return order;
  }

  getById(id: string) {
    const order = this.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  list(userId?: string) {
    if (!userId) return this.orders;
    return this.orders.filter((o) => o.userId === userId);
  }

  updateStatus(id: string, status: Order["status"]) {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx < 0) throw new NotFoundException("Order not found");
    this.orders[idx].status = status;
    return this.orders[idx];
  }
}
"""


NOTIFICATION_SERVICE = """import { Injectable } from "@nestjs/common";

type Notification = {
  id: string;
  userId: string;
  channel: "EMAIL" | "WEBHOOK" | "INAPP";
  title: string;
  content: string;
  status: "QUEUED" | "SENT" | "FAILED";
};

@Injectable()
export class AppService {
  private listData: Notification[] = [];

  getHealth() {
    return { service: "notification-service", status: "ok", timestamp: new Date().toISOString() };
  }

  create(payload: Omit<Notification, "id" | "status">) {
    const item: Notification = {
      id: `nt_${this.listData.length + 1}`,
      ...payload,
      status: "SENT"
    };
    this.listData.push(item);
    return item;
  }

  list(userId?: string) {
    if (!userId) return this.listData;
    return this.listData.filter((x) => x.userId === userId);
  }

  retry(id: string) {
    const item = this.listData.find((x) => x.id === id);
    if (!item) return { message: "Not found" };
    item.status = "SENT";
    return item;
  }
}
"""


GATEWAY_PACKAGE = """{
  "name": "api-gateway",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "test": "echo \\"No tests yet\\""
  },
  "dependencies": {
    "@nestjs/common": "^10.4.8",
    "@nestjs/core": "^10.4.8",
    "@nestjs/platform-express": "^10.4.8",
    "@nestjs/swagger": "^7.4.2",
    "jsonwebtoken": "^9.0.2",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.8",
    "@nestjs/schematics": "^10.1.4",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.10.2",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}
"""


GATEWAY_GUARD = """import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException("Missing token");
    try {
      const secret = process.env.JWT_SECRET || "change_me";
      req.user = jwt.verify(token, secret);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
"""


GATEWAY_ROLES = """import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
"""


GATEWAY_ROLES_GUARD = """import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const role = req.user?.role;
    return requiredRoles.includes(role);
  }
}
"""


GATEWAY_SERVICE = """import { Injectable } from "@nestjs/common";

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

  user(path: string, auth: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.user}${path}`, body, auth);
  }

  product(path: string, auth: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.product}${path}`, body, auth);
  }

  order(path: string, auth: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.order}${path}`, body, auth);
  }

  notification(path: string, auth: string, body?: unknown, method = "GET") {
    return this.request(method, `${mapUrl.notification}${path}`, body, auth);
  }
}
"""


GATEWAY_CONTROLLER = """import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";

@ApiTags("gateway")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health() {
    return this.appService.getHealth();
  }

  @Post("/auth/register")
  register(@Body() body: { email: string; password: string }) {
    return this.appService.auth("/api/v1/auth/register", body, "POST");
  }

  @Post("/auth/login")
  login(@Body() body: { email: string; password: string }) {
    return this.appService.auth("/api/v1/auth/login", body, "POST");
  }

  @Post("/auth/refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.appService.auth("/api/v1/auth/refresh", body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/users/me")
  me(@Headers("authorization") auth: string) {
    return this.appService.user("/api/v1/users/me", auth, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/products")
  products(@Headers("authorization") auth: string, @Query("search") search?: string) {
    return this.appService.product(`/api/v1/products?search=${search || ""}`, auth, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @Post("/products")
  createProduct(@Headers("authorization") auth: string, @Body() body: unknown) {
    return this.appService.product("/api/v1/products", auth, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("/orders")
  createOrder(@Headers("authorization") auth: string, @Body() body: unknown) {
    return this.appService.order("/api/v1/orders", auth, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @Patch("/orders/:id/status")
  updateOrderStatus(@Headers("authorization") auth: string, @Param("id") id: string, @Body() body: { status: string }) {
    return this.appService.order(`/api/v1/orders/${id}/status`, auth, body, "PATCH");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("/notifications/test")
  testNotify(@Headers("authorization") auth: string, @Body() body: unknown) {
    return this.appService.notification("/api/v1/notifications", auth, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete("/notifications/retry/:id")
  retryNotify(@Headers("authorization") auth: string, @Param("id") id: string) {
    return this.appService.notification(`/api/v1/notifications/retry/${id}`, auth, undefined, "POST");
  }
}
"""


APP_MODULE_GATEWAY = """import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
"""


OBS_NAMESPACE = """apiVersion: v1
kind: Namespace
metadata:
  name: observability
"""


PROM_CONFIG = """apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: observability
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
"""


PROM_DEPLOY = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.54.1
          args: ["--config.file=/etc/prometheus/prometheus.yml"]
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: config
              mountPath: /etc/prometheus
      volumes:
        - name: config
          configMap:
            name: prometheus-config
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: observability
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
"""


GRAFANA_DEPLOY = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:11.1.4
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: observability
spec:
  selector:
    app: grafana
  ports:
    - port: 3000
      targetPort: 3000
"""


LOKI_DEPLOY = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
    spec:
      containers:
        - name: loki
          image: grafana/loki:2.9.8
          args: ["-config.file=/etc/loki/local-config.yaml"]
          ports:
            - containerPort: 3100
---
apiVersion: v1
kind: Service
metadata:
  name: loki
  namespace: observability
spec:
  selector:
    app: loki
  ports:
    - port: 3100
      targetPort: 3100
"""


def update_auth():
    write("services/auth-service/package.json", AUTH_PACKAGE)
    write("services/auth-service/src/app.service.ts", AUTH_SERVICE)
    write("services/auth-service/src/app.controller.ts", AUTH_CONTROLLER)


def update_gateway():
    write("services/api-gateway/package.json", GATEWAY_PACKAGE)
    write("services/api-gateway/src/app.module.ts", APP_MODULE_GATEWAY)
    write("services/api-gateway/src/app.service.ts", GATEWAY_SERVICE)
    write("services/api-gateway/src/app.controller.ts", GATEWAY_CONTROLLER)
    write("services/api-gateway/src/jwt-auth.guard.ts", GATEWAY_GUARD)
    write("services/api-gateway/src/roles.decorator.ts", GATEWAY_ROLES)
    write("services/api-gateway/src/roles.guard.ts", GATEWAY_ROLES_GUARD)


def update_user():
    write("services/user-service/src/app.service.ts", USER_SERVICE)
    routes = """
  @Get("/users/:id")
  @ApiOperation({ summary: "Get user by profile id" })
  getById(@Param("id") id: string) {
    return this.appService.getById(id);
  }

  @Get("/users/me")
  @ApiOperation({ summary: "Get current user profile" })
  getMe() {
    return this.appService.getMe();
  }

  @Patch("/users/:id")
  @ApiOperation({ summary: "Update user profile" })
  update(@Param("id") id: string, @Body() body: { fullName?: string; phone?: string; avatarUrl?: string }) {
    return this.appService.update(id, body);
  }
"""
    write("services/user-service/src/app.controller.ts", CRUD_CONTROLLER.replace("__TAG__", "users").replace("__ROUTES__", routes))


def update_product():
    write("services/product-service/src/app.service.ts", PRODUCT_SERVICE)
    routes = """
  @Get("/products")
  @ApiOperation({ summary: "List products" })
  list(@Query("search") search?: string) {
    return this.appService.list(search || "");
  }

  @Post("/products")
  @ApiOperation({ summary: "Create product" })
  create(@Body() body: { sku: string; name: string; description?: string; price: number; stock: number; status: "ACTIVE" | "INACTIVE" }) {
    return this.appService.create(body);
  }

  @Get("/products/:id")
  @ApiOperation({ summary: "Get product by id" })
  getById(@Param("id") id: string) {
    return this.appService.getById(id);
  }

  @Patch("/products/:id")
  @ApiOperation({ summary: "Update product" })
  update(@Param("id") id: string, @Body() body: { name?: string; description?: string; price?: number; stock?: number; status?: "ACTIVE" | "INACTIVE" }) {
    return this.appService.update(id, body);
  }

  @Delete("/products/:id")
  @ApiOperation({ summary: "Soft delete product" })
  remove(@Param("id") id: string) {
    return this.appService.remove(id);
  }
"""
    write("services/product-service/src/app.controller.ts", CRUD_CONTROLLER.replace("__TAG__", "products").replace("__ROUTES__", routes))


def update_order():
    write("services/order-service/src/app.service.ts", ORDER_SERVICE)
    routes = """
  @Post("/orders")
  @ApiOperation({ summary: "Create order" })
  create(@Body() body: { userId?: string; items: { productId: string; qty: number }[] }) {
    return this.appService.create(body);
  }

  @Get("/orders/:id")
  @ApiOperation({ summary: "Get order by id" })
  getById(@Param("id") id: string) {
    return this.appService.getById(id);
  }

  @Get("/orders")
  @ApiOperation({ summary: "List orders" })
  list(@Query("userId") userId?: string) {
    return this.appService.list(userId);
  }

  @Patch("/orders/:id/status")
  @ApiOperation({ summary: "Update order status" })
  updateStatus(@Param("id") id: string, @Body() body: { status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" }) {
    return this.appService.updateStatus(id, body.status);
  }
"""
    write("services/order-service/src/app.controller.ts", CRUD_CONTROLLER.replace("__TAG__", "orders").replace("__ROUTES__", routes))


def update_notification():
    write("services/notification-service/src/app.service.ts", NOTIFICATION_SERVICE)
    routes = """
  @Post("/notifications")
  @ApiOperation({ summary: "Create notification" })
  create(@Body() body: { userId: string; channel: "EMAIL" | "WEBHOOK" | "INAPP"; title: string; content: string }) {
    return this.appService.create(body);
  }

  @Get("/notifications")
  @ApiOperation({ summary: "List notifications" })
  list(@Query("userId") userId?: string) {
    return this.appService.list(userId);
  }

  @Post("/notifications/retry/:id")
  @ApiOperation({ summary: "Retry notification" })
  retry(@Param("id") id: string) {
    return this.appService.retry(id);
  }
"""
    write("services/notification-service/src/app.controller.ts", CRUD_CONTROLLER.replace("__TAG__", "notifications").replace("__ROUTES__", routes))


def observability():
    write("gitops/observability/namespace.yaml", OBS_NAMESPACE)
    write("gitops/observability/prometheus-config.yaml", PROM_CONFIG)
    write("gitops/observability/prometheus.yaml", PROM_DEPLOY)
    write("gitops/observability/grafana.yaml", GRAFANA_DEPLOY)
    write("gitops/observability/loki.yaml", LOKI_DEPLOY)
    write(
        "gitops/observability/kustomization.yaml",
        """apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - namespace.yaml
  - prometheus-config.yaml
  - prometheus.yaml
  - grafana.yaml
  - loki.yaml
""",
    )


def update_compose():
    path = Path("docker-compose.yml")
    txt = path.read_text(encoding="utf-8")
    add_env = """
      - AUTH_SERVICE_URL=http://auth-service:8081
      - USER_SERVICE_URL=http://user-service:8082
      - PRODUCT_SERVICE_URL=http://product-service:8083
      - ORDER_SERVICE_URL=http://order-service:8084
      - NOTIFICATION_SERVICE_URL=http://notification-service:8085
      - JWT_SECRET=${JWT_SECRET}
"""
    txt = txt.replace("    environment:\n      - PORT=8080\n", "    environment:\n      - PORT=8080\n" + add_env)
    path.write_text(txt, encoding="utf-8")


def update_readme():
    p = Path("README.md")
    txt = p.read_text(encoding="utf-8")
    extra = """

## End-to-end API flow (through gateway)
1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login` -> get accessToken
3. `GET /api/v1/products` with `Authorization: Bearer <token>`
4. `POST /api/v1/orders` with token
5. `POST /api/v1/notifications/test` with token

## Observability manifests
- `gitops/observability/kustomization.yaml`
- Prometheus + Grafana + Loki are ready for ArgoCD sync.
"""
    if "End-to-end API flow" not in txt:
      p.write_text(txt + extra, encoding="utf-8")


def main():
    update_auth()
    update_gateway()
    update_user()
    update_product()
    update_order()
    update_notification()
    observability()
    update_compose()
    update_readme()
    print("Implemented contracts, gateway JWT/RBAC, and observability manifests.")


if __name__ == "__main__":
    main()
