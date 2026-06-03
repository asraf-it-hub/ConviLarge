import { Router } from "express";
import { optionalAuth } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
import { asyncHandler } from "../../utils/errors.js";
import { aiHistory, aiTools, aiUsage, createAiTask, downloadAiTask, readAiTask, removeAiTask } from "../controllers/aiController.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";
import { validateAiUpload } from "../middleware/aiValidation.js";

export const aiRoutes = Router();

aiRoutes.get("/tools", asyncHandler(aiTools));
aiRoutes.get("/history", optionalAuth, asyncHandler(aiHistory));
aiRoutes.get("/usage", optionalAuth, asyncHandler(aiUsage));
aiRoutes.post("/run", optionalAuth, aiRateLimit, upload.array("files", 20), validateAiUpload, asyncHandler(createAiTask));
aiRoutes.get("/tasks/:id", optionalAuth, asyncHandler(readAiTask));
aiRoutes.get("/tasks/:id/download", optionalAuth, asyncHandler(downloadAiTask));
aiRoutes.delete("/tasks/:id", optionalAuth, asyncHandler(removeAiTask));
