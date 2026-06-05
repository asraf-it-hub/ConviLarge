import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

export const systemStatus = {
  qpdf: false,
  qpdfPath: env.qpdfPath,
  qpdfVersion: null,
  checkedAt: null
};

const commonWindowsQpdfPaths = [
  "C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe",
  "C:\\Program Files\\qpdf\\bin\\qpdf.exe",
  "C:\\Program Files (x86)\\qpdf\\bin\\qpdf.exe"
];

function qpdfCandidates() {
  const configured = env.qpdfPath || "qpdf";
  const candidates = [configured];

  if (process.platform === "win32" && configured.toLowerCase() === "qpdf") {
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    candidates.push(
      path.join(programFiles, "qpdf 12.3.2", "bin", "qpdf.exe"),
      path.join(programFiles, "qpdf", "bin", "qpdf.exe"),
      path.join(programFilesX86, "qpdf", "bin", "qpdf.exe"),
      ...commonWindowsQpdfPaths
    );
  }

  return [...new Set(candidates)];
}

function runVersionCheck(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ["--version"], { windowsHide: true });
    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.on("error", () => resolve({ available: false, version: null }));
    child.on("close", (code) => {
      resolve({
        available: code === 0,
        version: code === 0 ? output.trim().split(/\r?\n/)[0] || null : null
      });
    });
  });
}

export async function detectSystemDependencies(options = {}) {
  let qpdf = { available: false, version: null };
  let resolvedPath = env.qpdfPath;

  for (const candidate of qpdfCandidates()) {
    if (candidate !== env.qpdfPath && !fs.existsSync(candidate)) continue;
    qpdf = await runVersionCheck(candidate);
    if (qpdf.available) {
      resolvedPath = candidate;
      break;
    }
  }

  systemStatus.qpdf = qpdf.available;
  systemStatus.qpdfPath = resolvedPath;
  systemStatus.qpdfVersion = qpdf.version;
  systemStatus.checkedAt = new Date().toISOString();

  if (!qpdf.available && !options.silent) {
    console.warn("QPDF is not available. PDF lock and unlock tools will return a service-unavailable error.");
  }

  return systemStatus;
}

export function getSystemStatus() {
  return {
    qpdf: systemStatus.qpdf,
    qpdfPath: systemStatus.qpdfPath,
    qpdfVersion: systemStatus.qpdfVersion,
    checkedAt: systemStatus.checkedAt
  };
}
