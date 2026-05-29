import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { processTool } from "../services/processors.js";
import { updateJobRecord } from "../services/jobStore.js";

const connection = createRedisConnection();

if (!connection) {
  console.log("Redis is not configured. Worker exits because inline processing is active.");
  process.exit(0);
}

new Worker(
  "file-processing",
  async (job) => {
    const { jobId, toolType, files, options } = job.data;
    await updateJobRecord(jobId, { status: "processing" });
    const outputFile = await processTool(toolType, files, options);
    await updateJobRecord(jobId, { status: "completed", outputFile });
    return outputFile;
  },
  { connection }
);

console.log("File worker started");
