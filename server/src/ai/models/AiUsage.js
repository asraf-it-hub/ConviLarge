import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    sessionId: String,
    dateKey: { type: String, required: true },
    provider: String,
    model: String,
    toolType: String,
    taskCount: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 }
  },
  { timestamps: true }
);

aiUsageSchema.index({ user: 1, dateKey: 1, toolType: 1 });
aiUsageSchema.index({ sessionId: 1, dateKey: 1, toolType: 1 });

export const AiUsage = mongoose.model("AiUsage", aiUsageSchema);
