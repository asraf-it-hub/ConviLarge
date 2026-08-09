import { Router } from "express";
import { submitBugReport, submitFeedback, submitSupportTicket } from "../controllers/supportController.js";
import { uploadSingle } from "../middleware/upload.js";
import { asyncHandler } from "../utils/errors.js";

export const supportRoutes = Router();

supportRoutes.post("/support", asyncHandler(submitSupportTicket));
supportRoutes.post("/feedback", asyncHandler(submitFeedback));
supportRoutes.post("/report-problem", uploadSingle, asyncHandler(submitBugReport));
