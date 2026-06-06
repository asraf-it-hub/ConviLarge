import { Router } from "express";
import rateLimit from "express-rate-limit";
import { optionalAuth } from "../middleware/auth.js";
import { transferUpload } from "../middleware/transferUpload.js";
import {
  createSecureTransfer,
  downloadSecureTransfer,
  lookupSecureTransfer,
  secureTransferDashboard,
  transferShell,
  verifySecureTransfer
} from "../controllers/transferController.js";
import { asyncHandler } from "../utils/errors.js";
import { env } from "../config/env.js";

export const transferRoutes = Router();

const transferAccessLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many access attempts. Please wait and try again." }
});

transferRoutes.post(
  "/",
  optionalAuth,
  transferUpload.array("files", env.transferMaxFiles),
  asyncHandler(createSecureTransfer)
);
transferRoutes.get("/dashboard", optionalAuth, asyncHandler(secureTransferDashboard));
transferRoutes.post("/lookup", transferAccessLimiter, asyncHandler(lookupSecureTransfer));
transferRoutes.get("/:transferId", asyncHandler(transferShell));
transferRoutes.post("/:transferId/verify", transferAccessLimiter, asyncHandler(verifySecureTransfer));
transferRoutes.post("/:transferId/download", transferAccessLimiter, asyncHandler(downloadSecureTransfer));
