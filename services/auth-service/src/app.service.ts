import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { connectDb } from "./db";
import { RefreshModel, UserModel } from "./models/auth.model";

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
    if (!user.passwordHash) throw new UnauthorizedException("Invalid credentials");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");
    const accessToken = this.sign({ sub: String(user._id), email: user.email ?? email, role: user.role ?? "USER" }, "1h");
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
    if (!row.tokenHash) throw new UnauthorizedException("Invalid refresh token");
    const ok = await bcrypt.compare(refreshToken, row.tokenHash);
    if (!ok) throw new UnauthorizedException("Invalid refresh token");
    const user = await UserModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException("User not found");
    return { accessToken: this.sign({ sub: String(user._id), email: user.email ?? "", role: user.role ?? "USER" }, "1h") };
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
