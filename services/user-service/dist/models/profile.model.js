"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileModel = void 0;
const mongoose_1 = require("mongoose");
const ProfileSchema = new mongoose_1.default.Schema({ userId: { type: String, unique: true, index: true }, fullName: String, phone: String, avatarUrl: String }, { timestamps: true });
exports.ProfileModel = mongoose_1.default.models.Profile ||
    mongoose_1.default.model("Profile", ProfileSchema);
//# sourceMappingURL=profile.model.js.map