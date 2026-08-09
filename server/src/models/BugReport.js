import mongoose from "mongoose";

const bugReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  email: { type: String, default: "" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  description: { type: String, required: true },
  screenshotUrl: { type: String, default: "" },
  status: { type: String, enum: ["new", "investigating", "resolved"], default: "new" },
  createdAt: { type: Date, default: Date.now }
});

export const BugReport = mongoose.model("BugReport", bugReportSchema);
