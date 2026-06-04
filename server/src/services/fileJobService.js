import path from "path";
import { processTool } from "./processors.js";
import { createJobRecord, deleteJobRecord, getJobRecord, updateJobRecord } from "./jobStore.js";
import { invalidateDashboardStats } from "./dashboardStatsService.js";
import { fileSnapshot, removeFile } from "../utils/fs.js";

function publicJob(job) {
  const output = job?.outputFile;
  return {
    id: job?.id || job?._id?.toString?.(),
    toolType: job?.toolType,
    status: job?.status,
    error: job?.error,
    createdAt: job?.createdAt,
    expiresAt: job?.expiresAt,
    meta: job?.meta,
    outputFile: output
      ? {
          name: output.originalName,
          size: output.size,
          downloadUrl: `/jobs/${job.id || job._id}/download`
        }
      : null
  };
}

export async function runToolJob({ toolType, files, options, user }) {
  const inputFiles = files.map((file) => fileSnapshot(file.path, file.originalname, file.mimetype, file.size));
  const job = await createJobRecord({
    toolType,
    status: "processing",
    inputFiles,
    user: user?._id || user?.id || null,
    meta: { originalTotalBytes: files.reduce((sum, file) => sum + file.size, 0) }
  });

  try {
    const result = await processTool(toolType, files, options);
    const isMetadataReport = result?.kind === "metadata";
    const outputFile = isMetadataReport ? null : result;
    const completed = await updateJobRecord(job.id, {
      status: "completed",
      outputFile,
      meta: {
        ...job.meta,
        ...(isMetadataReport ? { metadata: result.metadata } : {}),
        outputBytes: outputFile?.size || null,
        compressionRatio: outputFile?.size && job.meta?.originalTotalBytes
          ? Math.round((1 - outputFile.size / job.meta.originalTotalBytes) * 100)
          : null
      }
    });
    invalidateDashboardStats(user?._id || user?.id || null);
    return publicJob(completed);
  } catch (error) {
    await updateJobRecord(job.id, { status: "failed", error: error.message });
    throw error;
  } finally {
    await Promise.all(files.map((file) => removeFile(file.path)));
  }
}

export async function readJobForDownload(id, user = null) {
  const job = await getJobRecord(id, user?._id || user?.id || null);
  if (!job || job.status !== "completed" || !job.outputFile?.path) return null;
  return {
    job,
    filePath: job.outputFile.path,
    filename: job.outputFile.originalName || path.basename(job.outputFile.path)
  };
}

export async function deleteJobOutput(id, user = null) {
  const job = await deleteJobRecord(id, user?._id || user?.id || null);
  if (!job) return false;
  const files = [job.outputFile, ...(job.outputFiles || [])].filter(Boolean);
  await Promise.all(files.map((file) => removeFile(file.path)));
  return true;
}

export { publicJob };
