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
export declare const UserModel: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export declare const RefreshModel: mongoose.Model<IRefreshToken, {}, {}, {}, mongoose.Document<unknown, {}, IRefreshToken, {}, {}> & IRefreshToken & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
