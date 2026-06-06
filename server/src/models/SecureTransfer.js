import mongoose from "mongoose";

const transferFileSchema = new mongoose.Schema(
  {
    id: String,
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  { _id: false }
);

const transferEventSchema = new mongoose.Schema(
  {
    status: String,
    label: String,
    at: Date
  },
  { _id: false }
);

const secureTransferSchema = new mongoose.Schema(
  {
    transferId: { type: String, unique: true, index: true },
    accessKeyHash: { type: String, required: true, index: true },
    passwordHash: String,
    files: [transferFileSchema],
    status: { type: String, enum: ["uploaded", "viewed", "downloaded", "expired"], default: "uploaded" },
    oneTimeDownload: { type: Boolean, default: false },
    ownerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    ownerSession: String,
    viewedAt: Date,
    downloadedAt: Date,
    expiredAt: Date,
    expiresAt: { type: Date, required: true, index: true },
    events: [transferEventSchema],
    downloadCount: { type: Number, default: 0 },
    deletedAt: Date
  },
  { timestamps: true }
);

secureTransferSchema.index({ ownerUser: 1, createdAt: -1 });
secureTransferSchema.index({ ownerSession: 1, createdAt: -1 });
secureTransferSchema.index({ status: 1, expiresAt: 1 });

export const SecureTransfer = mongoose.model("SecureTransfer", secureTransferSchema);
