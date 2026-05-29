import { randomUUID } from "crypto";
import { dbState } from "../config/db.js";
import { env } from "../config/env.js";
import { ConversionJob } from "../models/ConversionJob.js";

const memoryJobs = new Map();

export function expiryDate() {
  return new Date(Date.now() + env.fileTtlHours * 60 * 60 * 1000);
}

function serialize(job) {
  const raw = job.toObject ? job.toObject() : job;
  return { ...raw, id: raw._id?.toString?.() || raw.id };
}

export async function createJobRecord(data) {
  const payload = { ...data, expiresAt: expiryDate() };
  if (dbState.connected && data.user) {
    const job = await ConversionJob.create(payload);
    return serialize(job);
  }

  const job = {
    id: randomUUID(),
    _id: null,
    status: "queued",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...payload
  };
  memoryJobs.set(job.id, job);
  return job;
}

export async function updateJobRecord(id, patch) {
  if (dbState.connected && !id.includes("-")) {
    const job = await ConversionJob.findByIdAndUpdate(id, patch, { new: true });
    return job ? serialize(job) : null;
  }

  const current = memoryJobs.get(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date() };
  memoryJobs.set(id, next);
  return next;
}

export async function getJobRecord(id, userId = null) {
  if (dbState.connected && !id.includes("-")) {
    const query = { _id: id };
    if (userId) query.user = userId;
    const job = await ConversionJob.findOne(query);
    return job ? serialize(job) : null;
  }
  return memoryJobs.get(id) || null;
}

export async function listUserJobs(userId) {
  if (!dbState.connected || !userId) return [];
  const jobs = await ConversionJob.find({ user: userId, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .limit(40);
  return jobs.map(serialize);
}

export function listMemoryJobs() {
  return [...memoryJobs.values()];
}
