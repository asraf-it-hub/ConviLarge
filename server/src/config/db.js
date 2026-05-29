import mongoose from "mongoose";
import { env } from "./env.js";

export const dbState = { connected: false, error: null };

export async function connectDb() {
  if (!env.mongodbUri) {
    dbState.error = "MONGODB_URI is not configured";
    return dbState;
  }

  try {
    await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    dbState.connected = true;
    dbState.error = null;
    console.log("MongoDB connected");
  } catch (error) {
    dbState.connected = false;
    dbState.error = error.message;
    console.warn("MongoDB unavailable; continuing without persistent history:", error.message);
  }

  return dbState;
}
