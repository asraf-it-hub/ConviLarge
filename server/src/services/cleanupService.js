import fs from "fs/promises";
import path from "path";
import { env, paths } from "../config/env.js";
import { removeFile } from "../utils/fs.js";

async function cleanupDir(dir) {
  const now = Date.now();
  const ttlMs = env.fileTtlHours * 60 * 60 * 1000;
  let deleted = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isFile() || entry.name === ".gitkeep") continue;
    const filePath = path.join(dir, entry.name);
    const stats = await fs.stat(filePath).catch(() => null);
    if (stats && now - stats.mtimeMs > ttlMs) {
      await removeFile(filePath);
      deleted += 1;
    }
  }

  return deleted;
}

export async function cleanupExpiredFiles() {
  const [uploads, temp, processed] = await Promise.all([
    cleanupDir(paths.uploads),
    cleanupDir(paths.temp),
    cleanupDir(paths.processed)
  ]);
  return { deleted: uploads + temp + processed, uploads, temp, processed };
}

export function startCleanupJob() {
  const run = () => cleanupExpiredFiles().catch((error) => console.warn("Cleanup failed:", error.message));
  run();
  setInterval(run, 60 * 60 * 1000).unref();
}
