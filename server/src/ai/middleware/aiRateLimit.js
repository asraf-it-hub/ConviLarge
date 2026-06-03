import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";

function aiLimitKey(req) {
  const userId = req.user?._id || req.user?.id;
  if (userId) return `user:${userId}`;

  const sessionId = String(req.headers["x-convilarge-session"] || "").trim().slice(0, 120);
  return sessionId ? `guest:${sessionId}` : `guest:${req.ip}`;
}

export const aiRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  keyGenerator: aiLimitKey,
  skip: (req) => Boolean(req.user),
  limit: () => env.aiFreeDailyTasks,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => {
    const limit = env.aiFreeDailyTasks;
    return {
      message: `You have used your ${limit} free AI tools for today. Sign in to continue with free unlimited AI tools access.`,
      code: "AI_GUEST_LIMIT_REACHED",
      limit,
      redirectTo: "/auth"
    };
  }
});
