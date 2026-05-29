import { cleanupExpiredFiles } from "../services/cleanupService.js";

export async function runCleanup(_req, res) {
  const result = await cleanupExpiredFiles();
  res.json(result);
}
