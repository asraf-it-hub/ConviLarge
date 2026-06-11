import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional for social login users
    provider: { type: String, default: "local" },
    googleId: { type: String },
    githubId: { type: String },
    avatarUrl: { type: String },
    username: { type: String, trim: true, unique: true, sparse: true, lowercase: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    bio: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastLoginAt: Date
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
