import { spawn } from "child_process";
import { env } from "../config/env.js";

export const systemStatus = {
  qpdf: false,
  qpdfVersion: null,
  checkedAt: null
};

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

export async function detectSystemDependencies() {
  const qpdf = await runVersionCheck(env.qpdfPath);
  systemStatus.qpdf = qpdf.available;
  systemStatus.qpdfVersion = qpdf.version;
  systemStatus.checkedAt = new Date().toISOString();

  if (!qpdf.available) {
    console.warn("QPDF is not available. PDF lock, unlock, and metadata cleanup tools will return a service-unavailable error.");
  }

  return systemStatus;
}

export function getSystemStatus() {
  return {
    qpdf: systemStatus.qpdf,
    qpdfVersion: systemStatus.qpdfVersion,
    checkedAt: systemStatus.checkedAt
  };
}
