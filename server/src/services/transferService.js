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

function parseDevice(req) {
  const ua = String(req.headers["user-agent"] || "");
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Firefox\//.test(ua) ? "Firefox"
      : /Chrome\//.test(ua) && !/Edg\//.test(ua) ? "Chrome"
        : /Safari\//.test(ua) && !/Chrome\//.test(ua) ? "Safari"
          : "Unknown";
  const os = /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
      : /Windows/.test(ua) ? "Windows"
        : /Mac OS X|Macintosh/.test(ua) ? "macOS"
          : /Linux/.test(ua) ? "Linux"
            : "Unknown";
  const type = /iPad|Tablet/.test(ua) ? "Tablet" : /Mobi|Android|iPhone/.test(ua) ? "Mobile" : "Desktop";
  return { type, browser, os, label: `${browser} on ${os}` };
}

function event(status, label, at = new Date(), device = null) {
  return { status, label, at, ...(device ? { device } : {}) };
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
  const text = transfer.transferType === "text"
    ? {
        title: transfer.messageTitle || "",
        senderName: transfer.senderName || "",
        content: extras.includeText ? transfer.textContent || "" : "",
        size: Buffer.byteLength(transfer.textContent || "", "utf8")
      }
    : null;
  return {
    transferId: transfer.transferId,
    transferType: transfer.transferType || "file",
    senderName: transfer.senderName || "",
    title: transfer.messageTitle || "",
    text,
    files: (transfer.files || []).map(publicFile),
    status: transfer.status,
    accessKey: transfer.accessKeyDisplay || extras.accessKey,
    oneTimeDownload: transfer.oneTimeDownload,
    oneTimeView: transfer.oneTimeView,
    passwordRequired: Boolean(transfer.passwordHash),
    createdAt: transfer.createdAt,
    expiresAt: transfer.expiresAt,
    viewedAt: transfer.viewedAt,
    downloadedAt: transfer.downloadedAt,
    expiredAt: transfer.expiredAt,
    viewCount: transfer.viewCount || 0,
    downloadCount: transfer.downloadCount || 0,
    lastViewedDevice: transfer.lastViewedDevice || null,
    lastDownloadedDevice: transfer.lastDownloadedDevice || null,
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

export async function createTransfer({ req, files, expiry = "24h", password = "", oneTimeDownload = false, transferType = "file", senderName = "", messageTitle = "", textContent = "", oneTimeView = false }) {
  const isText = transferType === "text";
  if (!isText && !files.length) throw new AppError("Add at least one file to share");
  if (isText && !String(textContent || "").trim()) throw new AppError("Add text content to share");
  if (!EXPIRY_OPTIONS[expiry]) throw new AppError("Choose a valid expiry time");

  const transferId = await uniqueTransferId();
  const accessKey = await uniqueAccessKey();
  const shareUrl = transferUrl(transferId, accessKey);
  const qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 320 });
  const now = new Date();

  const transfer = await createTransferRecord({
    transferId,
    accessKeyHash: hashAccessKey(accessKey),
    accessKeyDisplay: accessKey,
    passwordHash: password ? await bcrypt.hash(password, 12) : "",
    transferType: isText ? "text" : "file",
    senderName: String(senderName || "").trim().slice(0, 80),
    messageTitle: String(messageTitle || "").trim().slice(0, 120),
    textContent: isText ? String(textContent || "").slice(0, 250000) : "",
    files: isText ? [] : files.map((file) => ({
      id: crypto.randomUUID(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype || "application/octet-stream",
      size: file.size
    })),
    oneTimeDownload: oneTimeDownload === true || oneTimeDownload === "true",
    oneTimeView: oneTimeView === true || oneTimeView === "true",
    expiresAt: new Date(now.getTime() + EXPIRY_OPTIONS[expiry]),
    events: [event("uploaded", isText ? "Text Transfer Created" : "Upload Complete", now)],
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
  return verifyTransferWithRequest({ transferId, accessKey, password, req: null });
}

export async function verifyTransferWithRequest({ transferId, accessKey, password, req }) {
  const transfer = await getTransferById(transferId);
  await assertTransferOpen(transfer);
  await authenticateTransfer({ transfer, accessKey, password });
  if (transfer.transferType === "text") {
    return retrieveTextTransfer({ req, transferId, accessKey, password });
  }

  const now = new Date();
  const device = req ? parseDevice(req) : null;
  const nextEvents = [...(transfer.events || []), event("viewed", "Transfer Opened", now, device)];
  const updated = await updateTransferRecord(transfer.transferId, {
    status: transfer.status === "downloaded" ? "downloaded" : "viewed",
    viewedAt: transfer.viewedAt || now,
    viewCount: (transfer.viewCount || 0) + 1,
    ...(device ? { lastViewedDevice: device } : {}),
    events: nextEvents
  });
  return publicTransfer(updated, { includeText: updated.transferType === "text" });
}

export async function lookupTransfer({ accessKey, password, req = null }) {
  const transfer = await getTransferByAccessKeyHash(hashAccessKey(accessKey));
  await assertTransferOpen(transfer);
  return verifyTransferWithRequest({ transferId: transfer.transferId, accessKey, password, req });
}

export async function getTransferShell(transferId) {
  const transfer = await getTransferById(transferId);
  if (!transfer) throw new AppError("Transfer not found", 404);
  if (isExpired(transfer)) {
    const expired = await expireTransfer(transfer);
    return publicTransfer(expired);
  }
  return publicTransfer(transfer, { files: [], passwordRequired: Boolean(transfer.passwordHash), includeText: false });
}

export async function retrieveTextTransfer({ req, transferId, accessKey, password }) {
  const transfer = await getTransferById(transferId);
  await assertTransferOpen(transfer);
  await authenticateTransfer({ transfer, accessKey, password });
  if (transfer.transferType !== "text") throw new AppError("This transfer does not contain text", 400);

  const now = new Date();
  const device = parseDevice(req);
  const patch = {
    status: "downloaded",
    viewedAt: transfer.viewedAt || now,
    downloadedAt: now,
    viewCount: transfer.viewedAt ? transfer.viewCount || 0 : (transfer.viewCount || 0) + 1,
    downloadCount: (transfer.downloadCount || 0) + 1,
    lastViewedDevice: transfer.lastViewedDevice || device,
    lastDownloadedDevice: device,
    events: [
      ...(transfer.events || []),
      ...(transfer.viewedAt ? [] : [event("viewed", "Transfer Opened", now, device)]),
      event("downloaded", "Text Retrieved", now, device)
    ]
  };
  if (transfer.oneTimeView) {
    patch.deletedAt = now;
    patch.expiredAt = now;
    patch.status = "expired";
    patch.events.push(event("expired", "One-Time Text Transfer Deleted", now));
  }

  const updated = await updateTransferRecord(transfer.transferId, patch);
  return publicTransfer(updated, { includeText: true });
}

export async function sendTransferDownload({ req, res, transferId, accessKey, password }) {
  const transfer = await getTransferById(transferId);
  await assertTransferOpen(transfer);
  await authenticateTransfer({ transfer, accessKey, password });
  if (transfer.transferType === "text") throw new AppError("Use text retrieval for this transfer", 400);

  const missingFile = transfer.files.find((file) => !fs.existsSync(file.path));
  if (missingFile) throw new AppError("Files are no longer available", 410);

  const now = new Date();
  const device = parseDevice(req);
  await updateTransferRecord(transfer.transferId, {
    status: "downloaded",
    viewedAt: transfer.viewedAt || now,
    downloadedAt: now,
    viewCount: transfer.viewedAt ? transfer.viewCount || 0 : (transfer.viewCount || 0) + 1,
    downloadCount: (transfer.downloadCount || 0) + 1,
    lastViewedDevice: transfer.lastViewedDevice || device,
    lastDownloadedDevice: device,
    events: [
      ...(transfer.events || []),
      ...(transfer.viewedAt ? [] : [event("viewed", "Transfer Opened", now, device)]),
      event("downloaded", "Download Started", now, device)
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
    summary.textTransfers += transfer.transferType === "text" ? 1 : 0;
    summary.downloads += transfer.downloadCount || 0;
    if (transfer.status === "expired") summary.expiredTransfers += 1;
    return summary;
  }, { totalTransfers: 0, filesShared: 0, textTransfers: 0, downloads: 0, expiredTransfers: 0 });

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
