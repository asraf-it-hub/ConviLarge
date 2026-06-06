import archiver from "archiver";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { removeFile } from "../utils/fs.js";
import {
  createTransferRecord,
  getTransferByAccessKeyHash,
  getTransferById,
  listExpiredTransfers,
  listTransfersForOwner,
  updateTransferRecord
} from "./transferStore.js";

const EXPIRY_OPTIONS = {
  "10m": 10 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000
};

function randomBase32(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return value;
}

function hashAccessKey(accessKey) {
  return crypto.createHash("sha256").update(normalizeAccessKey(accessKey)).digest("hex");
}

function normalizeAccessKey(accessKey = "") {
  return String(accessKey).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function publicAccessKey(accessKey) {
  const clean = normalizeAccessKey(accessKey);
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

function ownerPayload(req) {
  return {
    ownerUser: req.user?._id || req.user?.id || null,
    ownerSession: req.headers["x-convilarge-session"] || ""
  };
}

function transferUrl(transferId, accessKey) {
  const base = env.clientUrl.replace(/\/$/, "");
  return `${base}/transfer/${transferId}?key=${encodeURIComponent(accessKey)}`;
}

function event(status, label, at = new Date()) {
  return { status, label, at };
}

function isExpired(transfer) {
  return new Date(transfer.expiresAt).getTime() <= Date.now() || transfer.status === "expired";
}

function isOwner(transfer, req) {
  const userId = req.user?._id?.toString?.() || req.user?.id;
  if (userId && transfer.ownerUser?.toString?.() === userId) return true;
  if (userId && String(transfer.ownerUser || "") === String(userId)) return true;
  const sessionId = req.headers["x-convilarge-session"];
  return Boolean(sessionId && transfer.ownerSession === sessionId);
}

function publicFile(file) {
  return {
    id: file.id,
    name: file.originalName,
    size: file.size,
    type: file.mimetype
  };
}

export function publicTransfer(transfer, extras = {}) {
  return {
    transferId: transfer.transferId,
    files: transfer.files.map(publicFile),
    status: transfer.status,
    oneTimeDownload: transfer.oneTimeDownload,
    passwordRequired: Boolean(transfer.passwordHash),
    createdAt: transfer.createdAt,
    expiresAt: transfer.expiresAt,
    viewedAt: transfer.viewedAt,
    downloadedAt: transfer.downloadedAt,
    expiredAt: transfer.expiredAt,
    downloadCount: transfer.downloadCount || 0,
    events: transfer.events || [],
    ...extras
  };
}

async function uniqueTransferId() {
  for (let tries = 0; tries < 8; tries += 1) {
    const transferId = `TRX-${randomBase32(6)}`;
    if (!(await getTransferById(transferId))) return transferId;
  }
  throw new AppError("Could not generate a transfer ID", 500);
}

async function uniqueAccessKey() {
  for (let tries = 0; tries < 8; tries += 1) {
    const accessKey = publicAccessKey(randomBase32(8));
    if (!(await getTransferByAccessKeyHash(hashAccessKey(accessKey)))) return accessKey;
  }
  throw new AppError("Could not generate an access key", 500);
}

export async function createTransfer({ req, files, expiry = "24h", password = "", oneTimeDownload = false }) {
  if (!files.length) throw new AppError("Add at least one file to share");
  if (!EXPIRY_OPTIONS[expiry]) throw new AppError("Choose a valid expiry time");

  const transferId = await uniqueTransferId();
  const accessKey = await uniqueAccessKey();
  const shareUrl = transferUrl(transferId, accessKey);
  const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 320 });
  const now = new Date();

  const transfer = await createTransferRecord({
    transferId,
    accessKeyHash: hashAccessKey(accessKey),
    passwordHash: password ? await bcrypt.hash(password, 12) : "",
    files: files.map((file) => ({
      id: crypto.randomUUID(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype || "application/octet-stream",
      size: file.size
    })),
    oneTimeDownload: oneTimeDownload === true || oneTimeDownload === "true",
    expiresAt: new Date(now.getTime() + EXPIRY_OPTIONS[expiry]),
    events: [event("uploaded", "Upload Complete", now)],
    ...ownerPayload(req)
  });

  return publicTransfer(transfer, { accessKey, shareUrl, qrDataUrl });
}

async function expireTransfer(transfer) {
  if (transfer.status === "expired") return transfer;
  await Promise.all((transfer.files || []).map((file) => removeFile(file.path)));
  const now = new Date();
  return updateTransferRecord(transfer.transferId, {
    status: "expired",
    expiredAt: now,
    deletedAt: now,
    events: [...(transfer.events || []), event("expired", "Transfer Expired", now)]
  });
}

async function assertTransferOpen(transfer) {
  if (!transfer) throw new AppError("Transfer not found", 404);
  if (isExpired(transfer)) {
    await expireTransfer(transfer);
    throw new AppError("This transfer has expired", 410);
  }
  if (transfer.deletedAt) throw new AppError("Files are no longer available", 410);
}

async function authenticateTransfer({ transfer, accessKey, password }) {
  if (transfer.accessKeyHash !== hashAccessKey(accessKey)) {
    throw new AppError("Invalid access key", 401);
  }
  if (transfer.passwordHash && !(await bcrypt.compare(password || "", transfer.passwordHash))) {
    throw new AppError("Password required or incorrect", 401);
  }
}

export async function verifyTransfer({ transferId, accessKey, password }) {
  const transfer = await getTransferById(transferId);
  await assertTransferOpen(transfer);
  await authenticateTransfer({ transfer, accessKey, password });

  const now = new Date();
  const nextEvents = transfer.viewedAt ? transfer.events : [...(transfer.events || []), event("viewed", "Transfer Opened", now)];
  const updated = await updateTransferRecord(transfer.transferId, {
    status: transfer.status === "downloaded" ? "downloaded" : "viewed",
    viewedAt: transfer.viewedAt || now,
    events: nextEvents
  });
  return publicTransfer(updated);
}

export async function lookupTransfer({ accessKey, password }) {
  const transfer = await getTransferByAccessKeyHash(hashAccessKey(accessKey));
  await assertTransferOpen(transfer);
  return verifyTransfer({ transferId: transfer.transferId, accessKey, password });
}

export async function getTransferShell(transferId) {
  const transfer = await getTransferById(transferId);
  if (!transfer) throw new AppError("Transfer not found", 404);
  if (isExpired(transfer)) {
    const expired = await expireTransfer(transfer);
    return publicTransfer(expired);
  }
  return publicTransfer(transfer, { files: [], passwordRequired: Boolean(transfer.passwordHash) });
}

export async function sendTransferDownload({ req, res, transferId, accessKey, password }) {
  const transfer = await getTransferById(transferId);
  await assertTransferOpen(transfer);
  await authenticateTransfer({ transfer, accessKey, password });

  const missingFile = transfer.files.find((file) => !fs.existsSync(file.path));
  if (missingFile) throw new AppError("Files are no longer available", 410);

  const now = new Date();
  await updateTransferRecord(transfer.transferId, {
    status: "downloaded",
    viewedAt: transfer.viewedAt || now,
    downloadedAt: now,
    downloadCount: (transfer.downloadCount || 0) + 1,
    events: [
      ...(transfer.events || []),
      ...(transfer.viewedAt ? [] : [event("viewed", "Transfer Opened", now)]),
      event("downloaded", "Download Started", now)
    ]
  });

  res.on("finish", async () => {
    const completedAt = new Date();
    const latest = await getTransferById(transfer.transferId);
    if (!latest) return;
    const patch = {
      events: [...(latest.events || []), event("downloaded", "Download Completed", completedAt)]
    };
    if (latest.oneTimeDownload) {
      await Promise.all((latest.files || []).map((file) => removeFile(file.path)));
      patch.deletedAt = completedAt;
      patch.expiredAt = completedAt;
      patch.status = "expired";
      patch.events.push(event("expired", "One-Time Transfer Deleted", completedAt));
    }
    await updateTransferRecord(latest.transferId, patch);
  });

  if (transfer.files.length === 1) {
    const file = transfer.files[0];
    return res.download(file.path, file.originalName);
  }

  const archiveName = `${transfer.transferId}-files.zip`;
  res.attachment(archiveName);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (error) => {
    throw error;
  });
  archive.pipe(res);
  transfer.files.forEach((file) => {
    archive.file(file.path, { name: file.originalName || path.basename(file.path) });
  });
  return archive.finalize();
}

export async function getTransferDashboard(req) {
  const transfers = await listTransfersForOwner({
    userId: req.user?._id || req.user?.id || null,
    sessionId: req.headers["x-convilarge-session"] || ""
  });

  const now = Date.now();
  const normalized = transfers.map((transfer) => ({
    ...transfer,
    status: new Date(transfer.expiresAt).getTime() <= now || transfer.deletedAt ? "expired" : transfer.status
  }));

  const stats = normalized.reduce((summary, transfer) => {
    summary.totalTransfers += 1;
    summary.filesShared += transfer.files?.length || 0;
    summary.downloads += transfer.downloadCount || 0;
    if (transfer.status === "expired") summary.expiredTransfers += 1;
    return summary;
  }, { totalTransfers: 0, filesShared: 0, downloads: 0, expiredTransfers: 0 });

  return {
    stats,
    transfers: normalized.map((transfer) => publicTransfer(transfer))
  };
}

export async function cleanupExpiredTransfers() {
  const expired = await listExpiredTransfers();
  let deleted = 0;
  for (const transfer of expired) {
    await expireTransfer(transfer);
    deleted += transfer.files?.length || 0;
  }
  return { transfers: expired.length, files: deleted };
}
