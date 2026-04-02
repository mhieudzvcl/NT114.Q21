"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
const mongoose_1 = require("mongoose");
let connected = false;
async function connectDb() {
    if (connected)
        return;
    const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017";
    const dbName = process.env.DB_NAME || "demo_db";
    await mongoose_1.default.connect(mongoUri, { dbName });
    connected = true;
}
//# sourceMappingURL=db.js.map