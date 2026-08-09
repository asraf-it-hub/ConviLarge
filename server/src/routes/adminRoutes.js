import { Router } from "express";
import {
  adminBugReports,
  adminFeedbacks,
  adminJobs,
  adminOverview,
  adminSupportTickets,
  adminUsers,
  deleteAdminJob,
  deleteAdminUser,
  updateAdminBugReport,
  updateAdminSupportTicket
} from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/errors.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.get("/overview", asyncHandler(adminOverview));
adminRoutes.get("/users", asyncHandler(adminUsers));
adminRoutes.get("/jobs", asyncHandler(adminJobs));
adminRoutes.delete("/users/:id", asyncHandler(deleteAdminUser));
adminRoutes.delete("/jobs/:id", asyncHandler(deleteAdminJob));

// Support Tickets, Feedback, Bug Reports
adminRoutes.get("/support-tickets", asyncHandler(adminSupportTickets));
adminRoutes.patch("/support-tickets/:id", asyncHandler(updateAdminSupportTicket));
adminRoutes.get("/feedbacks", asyncHandler(adminFeedbacks));
adminRoutes.get("/bug-reports", asyncHandler(adminBugReports));
adminRoutes.patch("/bug-reports/:id", asyncHandler(updateAdminBugReport));
