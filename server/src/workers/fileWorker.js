import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { processTool } from "../services/processors.js";
import { updateJobRecord } from "../services/jobStore.js";
import { detectSystemDependencies } from "../services/systemStatusService.js";

const connection = createRedisConnection();

if (!connection) {
  console.log("Redis is not configured. Worker exits because inline processing is active.");
  process.exit(0);
}

await detectSystemDependencies();

new Worker(
  "file-processing",
  async (job) => {
    const { jobId, toolType, files, options } = job.data;
    await updateJobRecord(jobId, { status: "processing" });
    const result = await processTool(toolType, files, options);
    const isMetadataReport = result?.kind === "metadata";
    const outputFile = isMetadataReport ? null : result;
    const patch = {
      status: "completed",
      outputFile
    };
    if (isMetadataReport) patch.meta = { metadata: result.metadata };
    await updateJobRecord(jobId, patch);
    return result;
  },
  { connection }
);

console.log("File worker started");
