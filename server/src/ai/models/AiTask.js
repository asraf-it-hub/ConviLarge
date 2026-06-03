import mongoose from "mongoose";

const aiFileSchema = new mongoose.Schema(
  {
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    textHash: String
  },
  { _id: false }
);

const aiUsageSchema = new mongoose.Schema(
  {
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 }
  },
  { _id: false }
);

const aiTaskSchema = new mongoose.Schema(
  {
    toolType: { type: String, required: true },
    status: { type: String, enum: ["queued", "processing", "completed", "failed"], default: "queued" },
    provider: String,
    model: String,
    inputFiles: [aiFileSchema],
    inputSummary: String,
    output: mongoose.Schema.Types.Mixed,
    error: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    sessionId: String,
    usage: aiUsageSchema,
    expiresAt: Date,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

aiTaskSchema.index({ user: 1, createdAt: -1 });
aiTaskSchema.index({ sessionId: 1, createdAt: -1 });
aiTaskSchema.index({ user: 1, toolType: 1, status: 1 });

export const AiTask = mongoose.model("AiTask", aiTaskSchema);
