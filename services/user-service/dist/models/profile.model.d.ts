import mongoose from "mongoose";
export interface IProfile {
    userId?: string;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
}
export declare const ProfileModel: mongoose.Model<IProfile, {}, {}, {}, mongoose.Document<unknown, {}, IProfile, {}, {}> & IProfile & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
