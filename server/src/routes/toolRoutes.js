import { Router } from "express";
import { asyncHandler } from "../utils/errors.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { upload, validateUpload } from "../middleware/upload.js";
import { createToolJob, dashboard, downloadJob, getJob, health, listTools } from "../controllers/toolController.js";
import { runCleanup } from "../controllers/cleanupController.js";

export const toolRoutes = Router();

toolRoutes.get("/health", asyncHandler(health));
toolRoutes.get("/tools", asyncHandler(listTools));
toolRoutes.post("/tools/run", optionalAuth, upload.array("files", 50), validateUpload, asyncHandler(createToolJob));
toolRoutes.get("/jobs/:id", optionalAuth, asyncHandler(getJob));
toolRoutes.get("/jobs/:id/download", optionalAuth, asyncHandler(downloadJob));
toolRoutes.get("/dashboard", requireAuth, asyncHandler(dashboard));
toolRoutes.post("/maintenance/cleanup", asyncHandler(runCleanup));

for (const endpoint of ["convert", "merge", "compress", "split", "security", "image", "pdf"]) {
  toolRoutes.post(`/${endpoint}`, optionalAuth, upload.array("files", 50), validateUpload, asyncHandler(createToolJob));
}
