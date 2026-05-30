import fs from "fs";
import { getTool, toolsByCategory, tools } from "../services/toolRegistry.js";
import { runToolJob, readJobForDownload, publicJob } from "../services/fileJobService.js";
import { getJobRecord, listUserJobs } from "../services/jobStore.js";
import { dbState } from "../config/db.js";
import { redisState } from "../config/redis.js";
import { AppError } from "../utils/errors.js";

export async function listTools(_req, res) {
  res.json({
    tools: Object.entries(tools).map(([id, tool]) => ({ id, ...tool })),
    categories: {
      convert: toolsByCategory("convert"),
      merge: toolsByCategory("merge"),
      compress: toolsByCategory("compress"),
      split: toolsByCategory("split"),
      security: toolsByCategory("security")
    }
  });
}

export async function createToolJob(req, res) {
  const tool = getTool(req.body.toolType);
  if (!tool) throw new AppError("Unknown tool", 404);

  const options = {
    level: req.body.level,
    pageRange: req.body.pageRange,
    password: req.body.password,
    width: req.body.width,
    height: req.body.height,
    keepAspect: req.body.keepAspect,
    cropX: req.body.cropX,
    cropY: req.body.cropY,
    cropWidth: req.body.cropWidth,
    cropHeight: req.body.cropHeight,
    angle: req.body.angle,
    watermarkText: req.body.watermarkText,
    watermarkPreset: req.body.watermarkPreset,
    watermarkTextOpacity: req.body.watermarkTextOpacity,
    watermarkTextRotation: req.body.watermarkTextRotation,
    watermarkTextColor: req.body.watermarkTextColor,
    watermarkImagePosition: req.body.watermarkImagePosition,
    watermarkImageOpacity: req.body.watermarkImageOpacity,
    watermarkImageScale: req.body.watermarkImageScale,
    watermarkImageRotation: req.body.watermarkImageRotation,
    watermarkLogoText: req.body.watermarkLogoText
  };

  const job = await runToolJob({
    toolType: req.body.toolType,
    files: req.files || [],
    options,
    user: req.user
  });

  res.status(201).json({ job });
}

export async function getJob(req, res) {
  const job = await getJobRecord(req.params.id, req.user?._id || req.user?.id || null);
  if (!job) throw new AppError("Job not found", 404);
  res.json({ job: publicJob(job) });
}

export async function downloadJob(req, res) {
  const result = await readJobForDownload(req.params.id, req.user);
  if (!result || !fs.existsSync(result.filePath)) throw new AppError("File is no longer available", 404);
  res.download(result.filePath, result.filename);
}

export async function dashboard(req, res) {
  const jobs = await listUserJobs(req.user._id || req.user.id);
  res.json({ jobs: jobs.map(publicJob) });
}

export async function health(_req, res) {
  res.json({
    ok: true,
    database: dbState.connected ? "connected" : "offline",
    databaseError: dbState.error,
    redis: redisState.connected ? "connected" : "inline-fallback",
    redisError: redisState.error,
    nativeHelpers: {
      qpdf: "required for PDF lock/unlock via QPDF_PATH",
      pdfRendering: "required for PDF to JPG via Sharp/libvips PDF support"
    }
  });
}
