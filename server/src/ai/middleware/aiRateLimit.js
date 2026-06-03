import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";

export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: (req) => (req.user ? env.aiAuthDailyTasks : env.aiFreeDailyTasks),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI usage limit reached. Please try again later or sign in for a higher limit." }
});
