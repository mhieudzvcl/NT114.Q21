import mongoose from "mongoose";

export interface IUser {
  email?: string;
  passwordHash?: string;
  role?: "ADMIN" | "USER";
}

export interface IRefreshToken {
  userId?: mongoose.Types.ObjectId;
  tokenHash?: string;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" }
  },
  { timestamps: true }
);

const RefreshSchema = new mongoose.Schema<IRefreshToken>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    tokenHash: String
  },
  { timestamps: true }
);

export const UserModel =
  (mongoose.models.AuthUser as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("AuthUser", UserSchema);

export const RefreshModel =
  (mongoose.models.RefreshToken as mongoose.Model<IRefreshToken>) ||
  mongoose.model<IRefreshToken>("RefreshToken", RefreshSchema);
