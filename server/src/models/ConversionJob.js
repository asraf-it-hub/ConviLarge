import mongoose from "mongoose";

const fileSnapshotSchema = new mongoose.Schema(
  {
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  { _id: false }
);

const conversionJobSchema = new mongoose.Schema(
  {
    toolType: { type: String, required: true },
    status: { type: String, enum: ["queued", "processing", "completed", "failed"], default: "queued" },
    inputFiles: [fileSnapshotSchema],
    outputFile: fileSnapshotSchema,
    outputFiles: [fileSnapshotSchema],
    error: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    expiresAt: Date,
    meta: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

conversionJobSchema.index({ user: 1, status: 1, updatedAt: -1 });
conversionJobSchema.index({ user: 1, status: 1, toolType: 1 });

export const ConversionJob = mongoose.model("ConversionJob", conversionJobSchema);
