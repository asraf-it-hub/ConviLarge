import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { paths } from "../config/env.js";

export async function ensureStorage() {
  await Promise.all(Object.values(paths).map((dir) => fs.mkdir(dir, { recursive: true })));
}

export function outputPath(extension) {
  const clean = extension.startsWith(".") ? extension : `.${extension}`;
  return path.join(paths.processed, `${randomUUID()}${clean}`);
}

export function fileSnapshot(filePath, originalName, mimetype, size) {
  return {
    originalName,
    filename: path.basename(filePath),
    path: filePath,
    mimetype,
    size
  };
}

export async function statSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export async function removeFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Already gone is fine for cleanup.
  }
}
