import { Router } from "express";
import { asyncHandler } from "../utils/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { getConfig, login, me, signup, socialLogin } from "../controllers/authController.js";

export const authRoutes = Router();

authRoutes.post("/signup", asyncHandler(signup));
authRoutes.post("/login", asyncHandler(login));
authRoutes.get("/me", requireAuth, asyncHandler(me));
authRoutes.get("/config", asyncHandler(getConfig));
authRoutes.post("/social-login", asyncHandler(socialLogin));
