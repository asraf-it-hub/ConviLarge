import mongoose from "mongoose";
import { dbState } from "../config/db.js";
import { ConversionJob } from "../models/ConversionJob.js";
import { listMemoryJobs } from "./jobStore.js";
import { tools } from "./toolRegistry.js";
import { AiTask } from "../ai/models/AiTask.js";
import { listMemoryAiTasks } from "../ai/services/aiTaskStore.js";
import { aiTools } from "../ai/config/aiTools.js";

const STATS_CACHE_MS = 60 * 1000;
const statsCache = new Map();

function normalizeUserId(userId) {
  return userId?.toString?.() || String(userId || "");
}

function toolName(toolType) {
  return tools[toolType]?.title || aiTools[toolType]?.title || toolType || null;
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

  const [jobCounts, aiCounts] = await Promise.all([
    ConversionJob.aggregate([
      { $match: { user: mongoUserId, status: "completed" } },
      { $group: { _id: "$toolType", count: { $sum: 1 } } }
    ]),
    AiTask.aggregate([
      { $match: { user: mongoUserId, status: "completed" } },
      { $group: { _id: "$toolType", count: { $sum: 1 } } }
    ])
  ]);

  const [lastJob, lastAi] = await Promise.all([
    ConversionJob.findOne({ user: mongoUserId, status: "completed" })
      .sort({ updatedAt: -1 })
      .select("toolType updatedAt"),
    AiTask.findOne({ user: mongoUserId, status: "completed" })
      .sort({ updatedAt: -1 })
      .select("toolType updatedAt")
  ]);

  // Combine counts
  const toolCounts = {};
  for (const item of jobCounts) {
    toolCounts[item._id] = (toolCounts[item._id] || 0) + item.count;
  }
  for (const item of aiCounts) {
    toolCounts[item._id] = (toolCounts[item._id] || 0) + item.count;
  }

  let mostUsed = null;
  for (const [toolType, count] of Object.entries(toolCounts)) {
    if (!mostUsed || count > mostUsed.count || (count === mostUsed.count && toolType < mostUsed.toolType)) {
      mostUsed = { toolType, count };
    }
  }

  // Determine last activity
  let lastActivity = null;
  const lastJobTime = lastJob ? new Date(lastJob.updatedAt).getTime() : 0;
  const lastAiTime = lastAi ? new Date(lastAi.updatedAt).getTime() : 0;

  if (lastJobTime || lastAiTime) {
    if (lastJobTime >= lastAiTime) {
      lastActivity = {
        toolType: lastJob.toolType,
        completedAt: lastJob.updatedAt
      };
    } else {
      lastActivity = {
        toolType: lastAi.toolType,
        completedAt: lastAi.updatedAt
      };
    }
  }

  return buildStats({
    mostUsed,
    lastActivity
  });
}

function getMemoryStats(userId) {
  const normalizedUserId = normalizeUserId(userId);
  const completedJobs = [
    ...listMemoryJobs(),
    ...listMemoryAiTasks()
  ].filter((job) => (
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
