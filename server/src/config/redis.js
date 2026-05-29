import IORedis from "ioredis";
import { env } from "./env.js";

export const redisState = { connected: false, error: null };

export function createRedisConnection() {
  if (!env.redisUrl) {
    redisState.error = "REDIS_URL is not configured";
    return null;
  }

  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
  });

  connection.on("ready", () => {
    redisState.connected = true;
    redisState.error = null;
    console.log("Redis connected");
  });

  connection.on("error", (error) => {
    redisState.connected = false;
    redisState.error = error.message;
  });

  connection.connect().catch((error) => {
    redisState.connected = false;
    redisState.error = error.message;
    console.warn("Redis unavailable; processing jobs inline:", error.message);
  });

  return connection;
}
