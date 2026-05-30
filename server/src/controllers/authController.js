import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbState } from "../config/db.js";
import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

const authSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(8)
});

function userResponse(user) {
  return { id: user._id?.toString?.() || user.id, name: user.name, email: user.email, role: user.role || "user" };
}

function roleForEmail(email) {
  return env.adminEmail && email.toLowerCase() === env.adminEmail ? "admin" : "user";
}

export async function signup(req, res) {
  if (!dbState.connected) throw new AppError("Accounts need MongoDB. Guest tools are still available.", 503);
  const data = authSchema.extend({ name: z.string().min(2).max(80) }).parse(req.body);
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError("An account with this email already exists", 409);
  const password = await bcrypt.hash(data.password, 12);
  const user = await User.create({ name: data.name, email: data.email, password, role: roleForEmail(data.email) });
  res.status(201).json({ user: userResponse(user), token: signToken(user) });
}

export async function login(req, res) {
  if (!dbState.connected) throw new AppError("Accounts need MongoDB. Guest tools are still available.", 503);
  const data = authSchema.omit({ name: true }).parse(req.body);
  const user = await User.findOne({ email: data.email });
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }
  const expectedRole = roleForEmail(user.email);
  if (expectedRole === "admin" && user.role !== "admin") {
    user.role = "admin";
  }
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ user: userResponse(user), token: signToken(user) });
}

export async function me(req, res) {
  res.json({ user: userResponse(req.user) });
}
