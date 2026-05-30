import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { dbState } from "../config/db.js";
import { User } from "../models/User.js";

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    if (dbState.connected) {
      req.user = await User.findById(payload.id).select("-password");
    } else {
      req.user = { _id: payload.id, email: payload.email, name: payload.name, role: payload.role || "user" };
    }
  } catch {
    req.user = null;
  }

  next();
}

export async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {});
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  return next();
}

export function signToken(user) {
  return jwt.sign(
    { id: user._id?.toString?.() || user.id, email: user.email, name: user.name, role: user.role || "user" },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
