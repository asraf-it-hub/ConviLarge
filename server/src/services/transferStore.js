import { randomUUID } from "crypto";
import { dbState } from "../config/db.js";
import { SecureTransfer } from "../models/SecureTransfer.js";

const memoryTransfers = new Map();

function serialize(record) {
  const raw = record.toObject ? record.toObject() : record;
  return { ...raw, id: raw._id?.toString?.() || raw.id };
}

function normalizeUserId(userId) {
  return userId?.toString?.() || String(userId || "");
}

export async function createTransferRecord(data) {
  if (dbState.connected) {
    const record = await SecureTransfer.create(data);
    return serialize(record);
  }

  const record = {
    id: randomUUID(),
    _id: null,
    status: "uploaded",
    downloadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data
  };
  memoryTransfers.set(record.transferId, record);
  return record;
}

export async function getTransferById(transferId) {
  if (dbState.connected) {
    const record = await SecureTransfer.findOne({ transferId });
    return record ? serialize(record) : null;
  }
  return memoryTransfers.get(transferId) || null;
}

export async function getTransferByAccessKeyHash(accessKeyHash) {
  if (dbState.connected) {
    const record = await SecureTransfer.findOne({ accessKeyHash }).sort({ createdAt: -1 });
    return record ? serialize(record) : null;
  }

  return [...memoryTransfers.values()]
    .filter((record) => record.accessKeyHash === accessKeyHash)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

export async function updateTransferRecord(transferId, patch) {
  if (dbState.connected) {
    const record = await SecureTransfer.findOneAndUpdate({ transferId }, patch, { new: true });
    return record ? serialize(record) : null;
  }

  const current = memoryTransfers.get(transferId);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date() };
  memoryTransfers.set(transferId, next);
  return next;
}

export async function listTransfersForOwner({ userId, sessionId, limit = 60 }) {
  if (dbState.connected) {
    const query = userId ? { ownerUser: userId } : { ownerSession: sessionId || "" };
    const records = await SecureTransfer.find(query).sort({ createdAt: -1 }).limit(limit);
    return records.map(serialize);
  }

  const normalizedUserId = normalizeUserId(userId);
  return [...memoryTransfers.values()]
    .filter((record) => {
      if (normalizedUserId) return normalizeUserId(record.ownerUser) === normalizedUserId;
      return record.ownerSession && record.ownerSession === sessionId;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export async function listExpiredTransfers(now = new Date()) {
  if (dbState.connected) {
    const records = await SecureTransfer.find({
      expiresAt: { $lte: now },
      status: { $ne: "expired" }
    }).limit(200);
    return records.map(serialize);
  }

  return [...memoryTransfers.values()].filter((record) => (
    record.status !== "expired" && new Date(record.expiresAt) <= now
  ));
}

export function listMemoryTransfers() {
  return [...memoryTransfers.values()];
}
