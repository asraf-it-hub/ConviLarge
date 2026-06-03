import { AppError } from "../../utils/errors.js";
import { deleteAiTask, getAiHistory, getAiStats, getAiTask, listAiTools, runAiTask } from "../services/aiTaskService.js";

function sessionId(req) {
  return req.headers["x-convilarge-session"] || req.ip;
}

export async function aiTools(_req, res) {
  res.json({ tools: listAiTools() });
}

export async function createAiTask(req, res) {
  const task = await runAiTask({
    toolType: req.body.toolType,
    files: req.files || [],
    options: req.body.options,
    provider: req.body.provider,
    user: req.user,
    sessionId: sessionId(req)
  });
  res.status(201).json({ task });
}

export async function readAiTask(req, res) {
  const task = await getAiTask(req.params.id, req.user, sessionId(req));
  if (!task) throw new AppError("AI task not found", 404);
  res.json({ task });
}

export async function removeAiTask(req, res) {
  const deleted = await deleteAiTask(req.params.id, req.user, sessionId(req));
  if (!deleted) throw new AppError("AI task not found", 404);
  res.status(204).end();
}

export async function aiHistory(req, res) {
  const tasks = await getAiHistory(req.user, sessionId(req));
  res.json({ tasks });
}

export async function aiUsage(req, res) {
  const usage = await getAiStats(req.user, sessionId(req));
  res.json({ usage });
}
