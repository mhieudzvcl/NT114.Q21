"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshModel = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.default.Schema({
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" }
}, { timestamps: true });
const RefreshSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, index: true },
    tokenHash: String
}, { timestamps: true });
exports.UserModel = mongoose_1.default.models.AuthUser ||
    mongoose_1.default.model("AuthUser", UserSchema);
exports.RefreshModel = mongoose_1.default.models.RefreshToken ||
    mongoose_1.default.model("RefreshToken", RefreshSchema);
//# sourceMappingURL=auth.model.js.map