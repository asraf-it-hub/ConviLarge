import mongoose from "mongoose";
import { dbState } from "../config/db.js";
import { ConversionJob } from "../models/ConversionJob.js";
import { listMemoryJobs } from "./jobStore.js";
import { tools } from "./toolRegistry.js";

const STATS_CACHE_MS = 60 * 1000;
const statsCache = new Map();

function normalizeUserId(userId) {
  return userId?.toString?.() || String(userId || "");
}

function toolName(toolType) {
  return tools[toolType]?.title || toolType || null;
}

function emptyStats() {
  return {
    mostUsedTool: null,
    lastActivity: null
  };
}

function getCachedStats(cacheKey) {
  const cached = statsCache.get(cacheKey);
  if (!cached || cached.expiresAt < Date.now()) return null;
  return cached.value;
}

function setCachedStats(cacheKey, value) {
  statsCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + STATS_CACHE_MS
  });
  return value;
}

function buildStats({ mostUsed, lastActivity }) {
  return {
    mostUsedTool: mostUsed
      ? {
          id: mostUsed.toolType,
          name: toolName(mostUsed.toolType),
          count: mostUsed.count
        }
      : null,
    lastActivity: lastActivity
      ? {
          toolId: lastActivity.toolType,
          toolName: toolName(lastActivity.toolType),
          completedAt: lastActivity.completedAt
        }
      : null
  };
}

async function getMongoStats(userId) {
  const normalizedUserId = normalizeUserId(userId);
  const mongoUserId = mongoose.Types.ObjectId.isValid(normalizedUserId)
    ? new mongoose.Types.ObjectId(normalizedUserId)
    : userId;

  const [result] = await ConversionJob.aggregate([
    { $match: { user: mongoUserId, status: "completed" } },
    {
      $facet: {
        usage: [
          { $group: { _id: "$toolType", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 1 },
          { $project: { _id: 0, toolType: "$_id", count: 1 } }
        ],
        last: [
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, toolType: 1, completedAt: "$updatedAt" } }
        ]
      }
    }
  ]);

  return buildStats({
    mostUsed: result?.usage?.[0] || null,
    lastActivity: result?.last?.[0] || null
  });
}

function getMemoryStats(userId) {
  const normalizedUserId = normalizeUserId(userId);
  const completedJobs = listMemoryJobs().filter((job) => (
    job.status === "completed" && normalizeUserId(job.user) === normalizedUserId
  ));

  if (!completedJobs.length) return emptyStats();

  const counts = completedJobs.reduce((map, job) => {
    map.set(job.toolType, (map.get(job.toolType) || 0) + 1);
    return map;
  }, new Map());

  const mostUsed = [...counts.entries()]
    .map(([toolType, count]) => ({ toolType, count }))
    .sort((a, b) => b.count - a.count || a.toolType.localeCompare(b.toolType))[0];

  const lastActivity = [...completedJobs].sort((a, b) => (
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  ))[0];

  return buildStats({
    mostUsed,
    lastActivity: {
      toolType: lastActivity.toolType,
      completedAt: lastActivity.updatedAt || lastActivity.createdAt
    }
  });
}

export async function getDashboardStats(userId) {
  if (!userId) return emptyStats();

  const cacheKey = normalizeUserId(userId);
  const cached = getCachedStats(cacheKey);
  if (cached) return cached;

  const stats = dbState.connected ? await getMongoStats(userId) : getMemoryStats(userId);
  return setCachedStats(cacheKey, stats);
}

export function invalidateDashboardStats(userId) {
  if (!userId) return;
  statsCache.delete(normalizeUserId(userId));
}
