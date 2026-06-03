import { randomUUID } from "crypto";
import { dbState } from "../../config/db.js";
import { env } from "../../config/env.js";
import { AiTask } from "../models/AiTask.js";

const memoryAiTasks = new Map();

function expiresAt() {
  return new Date(Date.now() + env.fileTtlHours * 60 * 60 * 1000);
}

function serialize(task) {
  const raw = task.toObject ? task.toObject() : task;
  return { ...raw, id: raw._id?.toString?.() || raw.id };
}

export async function createAiTaskRecord(data) {
  const payload = { ...data, expiresAt: expiresAt() };
  if (dbState.connected) {
    const task = await AiTask.create(payload);
    return serialize(task);
  }

  const task = {
    id: randomUUID(),
    _id: null,
    status: "queued",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...payload
  };
  memoryAiTasks.set(task.id, task);
  return task;
}

export async function updateAiTaskRecord(id, patch) {
  if (dbState.connected && !id.includes("-")) {
    const task = await AiTask.findByIdAndUpdate(id, patch, { new: true });
    return task ? serialize(task) : null;
  }

  const current = memoryAiTasks.get(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date() };
  memoryAiTasks.set(id, next);
  return next;
}

export async function getAiTaskRecord(id, userId = null, sessionId = null) {
  if (dbState.connected && !id.includes("-")) {
    const query = { _id: id };
    if (userId) query.user = userId;
    else if (sessionId) query.sessionId = sessionId;
    const task = await AiTask.findOne(query);
    return task ? serialize(task) : null;
  }
  const task = memoryAiTasks.get(id);
  if (!task) return null;
  if (userId && String(task.user) !== String(userId)) return null;
  if (!userId && sessionId && task.sessionId !== sessionId) return null;
  return task;
}

export async function listAiTaskHistory(userId, sessionId = null) {
  if (dbState.connected) {
    const query = { expiresAt: { $gt: new Date() } };
    if (userId) query.user = userId;
    else query.sessionId = sessionId;
    const tasks = await AiTask.find(query).sort({ createdAt: -1 }).limit(40);
    return tasks.map(serialize);
  }

  return [...memoryAiTasks.values()]
    .filter((task) => (userId ? String(task.user) === String(userId) : task.sessionId === sessionId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 40);
}

export async function deleteAiTaskRecord(id, userId = null, sessionId = null) {
  if (dbState.connected && !id.includes("-")) {
    const query = { _id: id };
    if (userId) query.user = userId;
    else if (sessionId) query.sessionId = sessionId;
    const task = await AiTask.findOneAndDelete(query);
    return task ? serialize(task) : null;
  }

  const task = await getAiTaskRecord(id, userId, sessionId);
  if (!task) return null;
  memoryAiTasks.delete(id);
  return task;
}

export function listMemoryAiTasks() {
  return [...memoryAiTasks.values()];
}
