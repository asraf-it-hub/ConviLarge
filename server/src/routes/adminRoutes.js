import { Router } from "express";
import { adminJobs, adminOverview, adminUsers, deleteAdminJob, deleteAdminUser } from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/overview", asyncHandler(adminOverview));
adminRoutes.get("/users", asyncHandler(adminUsers));
adminRoutes.get("/jobs", asyncHandler(adminJobs));
adminRoutes.delete("/users/:id", asyncHandler(deleteAdminUser));
adminRoutes.delete("/jobs/:id", asyncHandler(deleteAdminJob));
