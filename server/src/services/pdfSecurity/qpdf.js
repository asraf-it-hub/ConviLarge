import { spawn } from "child_process";
import { AppError } from "../../utils/errors.js";
import { detectSystemDependencies, systemStatus } from "../systemStatusService.js";

export async function requireQpdf() {
  if (!systemStatus.qpdf) {
    await detectSystemDependencies({ silent: true });
    if (!systemStatus.qpdf) {
      throw new AppError("QPDF is not installed on this server. PDF security tools are temporarily unavailable.", 503);
    }
  }
}

function qpdfMessage(stderr, fallback) {
  const message = String(stderr || "").trim();
  const lower = message.toLowerCase();

  if (lower.includes("invalid password") || lower.includes("incorrect password") || lower.includes("password is incorrect")) {
    return "The password is incorrect. Please check it and try again.";
  }
  if (lower.includes("encrypted") && lower.includes("password")) {
    return "This PDF is encrypted. Enter the correct password and try again.";
  }
  if (lower.includes("not a pdf") || lower.includes("no pdf header") || lower.includes("invalid pdf")) {
    return "This file does not look like a valid PDF. Please upload a different PDF.";
  }
  if (lower.includes("not encrypted")) {
    return "This PDF is not password protected.";
  }

  return fallback;
}

export async function runQpdf(args, fallback = "QPDF could not process this PDF.") {
  await requireQpdf();

  return new Promise((resolve, reject) => {
    const child = spawn(systemStatus.qpdfPath || "qpdf", args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", () => {
      reject(new AppError("QPDF is not installed on this server. PDF security tools are temporarily unavailable.", 503));
    });
    child.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new AppError(qpdfMessage(stderr, fallback), 400));
    });
  });
}

export async function isEncrypted(filePath) {
  const { stdout } = await runQpdf(["--show-encryption", filePath], "Could not inspect PDF encryption.");
  return !stdout.toLowerCase().includes("file is not encrypted");
}
