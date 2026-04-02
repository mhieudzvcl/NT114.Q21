from pathlib import Path
import json


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def update_package_json(path: str, service_name: str):
    package = {
        "name": service_name,
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "build": "nest build",
            "start": "node dist/main.js",
            "start:dev": "nest start --watch",
            "test": "echo \"No tests yet\"",
        },
        "dependencies": {
            "@nestjs/common": "^10.4.8",
            "@nestjs/core": "^10.4.8",
            "@nestjs/platform-express": "^10.4.8",
            "@nestjs/swagger": "^7.4.2",
            "mongoose": "^8.9.2",
            "reflect-metadata": "^0.2.2",
            "rxjs": "^7.8.1",
            "swagger-ui-express": "^5.0.1",
        },
        "devDependencies": {
            "@nestjs/cli": "^10.4.8",
            "@nestjs/schematics": "^10.1.4",
            "@types/node": "^22.10.2",
            "ts-loader": "^9.5.1",
            "ts-node": "^10.9.2",
            "typescript": "^5.7.2",
        },
    }
    if service_name == "auth-service":
        package["dependencies"]["jsonwebtoken"] = "^9.0.2"
        package["dependencies"]["bcryptjs"] = "^2.4.3"
        package["devDependencies"]["@types/jsonwebtoken"] = "^9.0.7"
        package["devDependencies"]["@types/bcryptjs"] = "^2.4.6"
    write(path, json.dumps(package, indent=2))


COMMON_DB = """import mongoose from "mongoose";

let connected = false;

export async function connectDb() {
  if (connected) return;
  const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017";
  const dbName = process.env.DB_NAME || "demo_db";
  await mongoose.connect(mongoUri, { dbName });
  connected = true;
}
"""


AUTH_SERVICE = """import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDb } from "./db";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" }
  },
  { timestamps: true }
);

const RefreshSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    tokenHash: String
  },
  { timestamps: true }
);

const UserModel = mongoose.models.AuthUser || mongoose.model("AuthUser", UserSchema);
const RefreshModel = mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshSchema);

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
  }

  private sign(payload: Record<string, unknown>, expiresIn: string) {
    const secret = process.env.JWT_SECRET || "change_me";
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  async register(email: string, password: string) {
    const exists = await UserModel.findOne({ email }).lean();
    if (exists) return { message: "Email already registered", userId: String(exists._id), email };
    const role = (await UserModel.countDocuments()) === 0 ? "ADMIN" : "USER";
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await UserModel.create({ email, passwordHash, role });
    return { userId: String(created._id), email: created.email, role: created.role };
  }

  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email });
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    const accessToken = this.sign({ sub: String(user._id), email: user.email, role: user.role }, "1h");
    const refreshToken = this.sign({ sub: String(user._id), type: "refresh" }, "7d");
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await RefreshModel.deleteMany({ userId: user._id });
    await RefreshModel.create({ userId: user._id, tokenHash });
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const secret = process.env.JWT_SECRET || "change_me";
    const payload = jwt.verify(refreshToken, secret) as { sub: string };
    const row = await RefreshModel.findOne({ userId: payload.sub });
    if (!row) throw new UnauthorizedException("Invalid refresh token");
    const ok = await bcrypt.compare(refreshToken, row.tokenHash);
    if (!ok) throw new UnauthorizedException("Invalid refresh token");
    const user = await UserModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException("User not found");
    return { accessToken: this.sign({ sub: String(user._id), email: user.email, role: user.role }, "1h") };
  }

  async logout(refreshToken: string) {
    const secret = process.env.JWT_SECRET || "change_me";
    const payload = jwt.verify(refreshToken, secret) as { sub: string };
    await RefreshModel.deleteMany({ userId: payload.sub });
    return { success: true };
  }

  getHealth() {
    return { service: "auth-service", status: "ok", timestamp: new Date().toISOString() };
  }
}
"""


USER_SERVICE = """import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import mongoose from "mongoose";
import { connectDb } from "./db";

const ProfileSchema = new mongoose.Schema(
  { userId: { type: String, unique: true, index: true }, fullName: String, phone: String, avatarUrl: String },
  { timestamps: true }
);
const ProfileModel = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
    const count = await ProfileModel.countDocuments();
    if (count === 0) await ProfileModel.create({ userId: "u_1", fullName: "Admin User" });
  }

  getHealth() {
    return { service: "user-service", status: "ok", timestamp: new Date().toISOString() };
  }

  async getMe(userId = "u_1") {
    return ProfileModel.findOne({ userId }).lean();
  }

  async getById(id: string) {
    const found = await ProfileModel.findById(id).lean();
    if (!found) throw new NotFoundException("Profile not found");
    return found;
  }

  async update(id: string, payload: { fullName?: string; phone?: string; avatarUrl?: string }) {
    const updated = await ProfileModel.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!updated) throw new NotFoundException("Profile not found");
    return updated;
  }
}
"""


PRODUCT_SERVICE = """import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import mongoose from "mongoose";
import { connectDb } from "./db";

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, index: true },
    name: String,
    description: String,
    price: Number,
    stock: Number,
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
  },
  { timestamps: true }
);
const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      await ProductModel.create({ sku: "SKU-001", name: "Demo Product", price: 100000, stock: 30, status: "ACTIVE" });
    }
  }

  getHealth() {
    return { service: "product-service", status: "ok", timestamp: new Date().toISOString() };
  }

  async list(search = "") {
    return ProductModel.find({ name: { $regex: search, $options: "i" } }).lean();
  }

  async create(payload: { sku: string; name: string; description?: string; price: number; stock: number; status: "ACTIVE" | "INACTIVE" }) {
    return ProductModel.create(payload);
  }

  async getById(id: string) {
    const item = await ProductModel.findById(id).lean();
    if (!item) throw new NotFoundException("Product not found");
    return item;
  }

  async update(id: string, payload: Record<string, unknown>) {
    const item = await ProductModel.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!item) throw new NotFoundException("Product not found");
    return item;
  }

  async remove(id: string) {
    return this.update(id, { status: "INACTIVE" });
  }
}
"""


ORDER_SERVICE = """import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import mongoose from "mongoose";
import { connectDb } from "./db";

const OrderSchema = new mongoose.Schema(
  {
    userId: String,
    items: [{ productId: String, qty: Number, unitPrice: Number }],
    totalAmount: Number,
    status: { type: String, enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED"], default: "PENDING" }
  },
  { timestamps: true }
);
const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
  }

  getHealth() {
    return { service: "order-service", status: "ok", timestamp: new Date().toISOString() };
  }

  async create(payload: { userId?: string; items: { productId: string; qty: number }[] }) {
    const items = payload.items.map((i) => ({ ...i, unitPrice: 100000 }));
    const totalAmount = items.reduce((acc, x) => acc + x.qty * x.unitPrice, 0);
    return OrderModel.create({ userId: payload.userId || "u_1", items, totalAmount, status: "PENDING" });
  }

  async getById(id: string) {
    const order = await OrderModel.findById(id).lean();
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async list(userId?: string) {
    if (!userId) return OrderModel.find({}).lean();
    return OrderModel.find({ userId }).lean();
  }

  async updateStatus(id: string, status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED") {
    const order = await OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }
}
"""


NOTI_SERVICE = """import { Injectable, OnModuleInit } from "@nestjs/common";
import mongoose from "mongoose";
import { connectDb } from "./db";

const NotificationSchema = new mongoose.Schema(
  {
    userId: String,
    channel: { type: String, enum: ["EMAIL", "WEBHOOK", "INAPP"] },
    title: String,
    content: String,
    status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], default: "SENT" }
  },
  { timestamps: true }
);
const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await connectDb();
  }

  getHealth() {
    return { service: "notification-service", status: "ok", timestamp: new Date().toISOString() };
  }

  async create(payload: { userId: string; channel: "EMAIL" | "WEBHOOK" | "INAPP"; title: string; content: string }) {
    return NotificationModel.create({ ...payload, status: "SENT" });
  }

  async list(userId?: string) {
    if (!userId) return NotificationModel.find({}).lean();
    return NotificationModel.find({ userId }).lean();
  }

  async retry(id: string) {
    const item = await NotificationModel.findByIdAndUpdate(id, { status: "SENT" }, { new: true }).lean();
    return item || { message: "Not found" };
  }
}
"""


POSTMAN = {
    "info": {
        "name": "Thesis DevSecOps Gateway E2E",
        "_postman_id": "dbff63f2-a95b-4e98-a726-4f5e086f2b91",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "item": [
        {
            "name": "Register",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "url": {"raw": "{{baseUrl}}/api/v1/auth/register", "host": ["{{baseUrl}}"], "path": ["api", "v1", "auth", "register"]},
                "body": {"mode": "raw", "raw": '{"email":"admin@example.com","password":"12345678"}'},
            },
        },
        {
            "name": "Login",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "url": {"raw": "{{baseUrl}}/api/v1/auth/login", "host": ["{{baseUrl}}"], "path": ["api", "v1", "auth", "login"]},
                "body": {"mode": "raw", "raw": '{"email":"admin@example.com","password":"12345678"}'},
            },
        },
        {
            "name": "List Products",
            "request": {
                "method": "GET",
                "header": [{"key": "Authorization", "value": "Bearer {{accessToken}}"}],
                "url": {"raw": "{{baseUrl}}/api/v1/products", "host": ["{{baseUrl}}"], "path": ["api", "v1", "products"]},
            },
        },
        {
            "name": "Create Order",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{accessToken}}"},
                ],
                "url": {"raw": "{{baseUrl}}/api/v1/orders", "host": ["{{baseUrl}}"], "path": ["api", "v1", "orders"]},
                "body": {"mode": "raw", "raw": '{"items":[{"productId":"demo","qty":2}]}'},
            },
        },
        {
            "name": "Create Notification",
            "request": {
                "method": "POST",
                "header": [
                    {"key": "Content-Type", "value": "application/json"},
                    {"key": "Authorization", "value": "Bearer {{accessToken}}"},
                ],
                "url": {"raw": "{{baseUrl}}/api/v1/notifications/test", "host": ["{{baseUrl}}"], "path": ["api", "v1", "notifications", "test"]},
                "body": {"mode": "raw", "raw": '{"userId":"u_1","channel":"EMAIL","title":"test","content":"hello"}'},
            },
        },
    ],
    "variable": [{"key": "baseUrl", "value": "http://localhost:8080"}, {"key": "accessToken", "value": ""}],
}


def main():
    services = ["auth-service", "user-service", "product-service", "order-service", "notification-service"]
    for svc in services:
        update_package_json(f"services/{svc}/package.json", svc)
        write(f"services/{svc}/src/db.ts", COMMON_DB)

    write("services/auth-service/src/app.service.ts", AUTH_SERVICE)
    write("services/user-service/src/app.service.ts", USER_SERVICE)
    write("services/product-service/src/app.service.ts", PRODUCT_SERVICE)
    write("services/order-service/src/app.service.ts", ORDER_SERVICE)
    write("services/notification-service/src/app.service.ts", NOTI_SERVICE)

    write("docs/postman/DevSecOps_Gateway_E2E.postman_collection.json", json.dumps(POSTMAN, indent=2))
    print("Migrated services to MongoDB-backed storage and created Postman collection.")


if __name__ == "__main__":
    main()
