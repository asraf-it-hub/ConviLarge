import { dbState } from "../../config/db.js";
import { AiUsage } from "../models/AiUsage.js";
import { listMemoryAiTasks } from "./aiTaskStore.js";

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function recordAiUsage({ user, sessionId, toolType, provider, model, usage }) {
  const payload = {
    user: user?._id || user?.id || null,
    sessionId,
    dateKey: dateKey(),
    provider,
    model,
    toolType,
    taskCount: 1,
    inputTokens: usage?.inputTokens || 0,
    outputTokens: usage?.outputTokens || 0,
    totalTokens: usage?.totalTokens || 0,
    estimatedCostUsd: usage?.estimatedCostUsd || 0
  };

  if (!dbState.connected) return payload;

  await AiUsage.findOneAndUpdate(
    {
      user: payload.user,
      sessionId: payload.user ? undefined : sessionId,
      dateKey: payload.dateKey,
      provider,
      model,
      toolType
    },
    { $inc: {
      taskCount: payload.taskCount,
      inputTokens: payload.inputTokens,
      outputTokens: payload.outputTokens,
      totalTokens: payload.totalTokens,
      estimatedCostUsd: payload.estimatedCostUsd
    } },
    { upsert: true, new: true }
  );

  return payload;
}

export async function getAiUsageSummary(userId, sessionId = null) {
  const today = dateKey();
  if (dbState.connected) {
    const query = userId ? { user: userId } : { sessionId };
    const [todayRows, allRows] = await Promise.all([
      AiUsage.find({ ...query, dateKey: today }),
      AiUsage.find(query).sort({ dateKey: -1 }).limit(120)
    ]);

    const totals = allRows.reduce((acc, row) => ({
      taskCount: acc.taskCount + row.taskCount,
      inputTokens: acc.inputTokens + row.inputTokens,
      outputTokens: acc.outputTokens + row.outputTokens,
      totalTokens: acc.totalTokens + row.totalTokens,
      estimatedCostUsd: acc.estimatedCostUsd + row.estimatedCostUsd
    }), { taskCount: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 });

    return {
      todayTasks: todayRows.reduce((sum, row) => sum + row.taskCount, 0),
      totals,
      recent: allRows
    };
  }

  const tasks = listMemoryAiTasks().filter((task) => (userId ? String(task.user) === String(userId) : task.sessionId === sessionId));
  return {
    todayTasks: tasks.filter((task) => new Date(task.createdAt).toISOString().slice(0, 10) === today).length,
    totals: tasks.reduce((acc, task) => ({
      taskCount: acc.taskCount + (task.status === "completed" ? 1 : 0),
      inputTokens: acc.inputTokens + (task.usage?.inputTokens || 0),
      outputTokens: acc.outputTokens + (task.usage?.outputTokens || 0),
      totalTokens: acc.totalTokens + (task.usage?.totalTokens || 0),
      estimatedCostUsd: acc.estimatedCostUsd + (task.usage?.estimatedCostUsd || 0)
    }), { taskCount: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 }),
    recent: []
  };
}
