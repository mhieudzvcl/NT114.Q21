import mongoose from "mongoose";

let connected = false;

export async function connectDb() {
  if (connected) return;
  const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017";
  const dbName = process.env.DB_NAME || "demo_db";
  await mongoose.connect(mongoUri, { dbName });
  connected = true;
}
