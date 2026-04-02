import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { connectDb } from "./db";

import { ProfileModel } from "./models/profile.model";

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
