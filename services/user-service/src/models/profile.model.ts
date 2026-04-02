import mongoose from "mongoose";

export interface IProfile {
  userId?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

const ProfileSchema = new mongoose.Schema<IProfile>(
  { userId: { type: String, unique: true, index: true }, fullName: String, phone: String, avatarUrl: String },
  { timestamps: true }
);

export const ProfileModel =
  (mongoose.models.Profile as mongoose.Model<IProfile>) ||
  mongoose.model<IProfile>("Profile", ProfileSchema);
