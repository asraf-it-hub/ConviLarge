import mongoose from "mongoose";

const uploadedFileSchema = new mongoose.Schema(
  {
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "ConversionJob", required: false },
    expiresAt: Date
  },
  { timestamps: true }
);

export const UploadedFile = mongoose.model("UploadedFile", uploadedFileSchema);
