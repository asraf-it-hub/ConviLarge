import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import { env } from "./config/env.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { toolRoutes } from "./routes/toolRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 160, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(mongoSanitize());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api", toolRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
