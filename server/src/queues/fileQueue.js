import { Queue } from "bullmq";
import { createRedisConnection, redisState } from "../config/redis.js";

const connection = createRedisConnection();

export const fileQueue = connection
  ? new Queue("file-processing", {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100
      }
    })
  : null;

export function queueReady() {
  return Boolean(fileQueue && redisState.connected);
}
