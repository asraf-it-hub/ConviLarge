import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import qpdfModule from "@neslinesli93/qpdf-wasm";
import { AppError } from "../../utils/errors.js";
import { detectSystemDependencies, systemStatus } from "../systemStatusService.js";

export async function requireQpdf() {
  return true;
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

async function runQpdfWasm(args, fallback) {
  let mod;
  try {
    mod = await qpdfModule();
  } catch (e) {
    throw new AppError("Could not initialize PDF security engine.", 500);
  }

  const fileArgs = [];
  const flags = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") continue;
    if (arg.startsWith("--")) {
      flags.push(arg);
      if (arg === "--encrypt" && i + 3 < args.length) {
        flags.push(args[i + 1], args[i + 2], args[i + 3]);
        i += 3;
      }
    } else {
      fileArgs.push(arg);
    }
  }

  const inPath = fileArgs[0];
  const outPath = fileArgs[1];

  let stdout = "";
  let stderr = "";

  mod.print = (text) => { stdout += text + "\n"; };
  mod.printErr = (text) => { stderr += text + "\n"; };

  const wasmIn = `in_${Date.now()}.pdf`;
  const wasmOut = `out_${Date.now()}.pdf`;

  try {
    const inBuffer = await fs.readFile(inPath);
    mod.FS.writeFile(wasmIn, inBuffer);

    const wasmArgs = [];
    if (flags.includes("--show-encryption")) {
      wasmArgs.push("--show-encryption", wasmIn);
    } else if (flags.some((f) => f.startsWith("--decrypt"))) {
      const pwdArg = flags.find((f) => f.startsWith("--password="));
      if (pwdArg) wasmArgs.push(pwdArg);
      wasmArgs.push("--decrypt", wasmIn, wasmOut);
    } else if (flags.includes("--encrypt")) {
      const encIdx = flags.indexOf("--encrypt");
      const userP = flags[encIdx + 1];
      const ownerP = flags[encIdx + 2];
      const keyLen = flags[encIdx + 3] || "256";
      wasmArgs.push(wasmIn, wasmOut, "--encrypt", userP, ownerP, keyLen, "--");
    } else {
      wasmArgs.push(wasmIn, wasmOut);
    }

    mod.callMain(wasmArgs);

    if (wasmArgs.includes(wasmOut)) {
      const outBuffer = mod.FS.readFile(wasmOut);
      await fs.writeFile(outPath, outBuffer);
      mod.FS.unlink(wasmOut);
    }
    mod.FS.unlink(wasmIn);

    return { stdout, stderr };
  } catch (error) {
    if (stderr.toLowerCase().includes("incorrect") || stderr.toLowerCase().includes("invalid")) {
      throw new AppError(qpdfMessage(stderr, fallback), 400);
    }
    try {
      if (wasmOut && mod?.FS) {
        const outBuffer = mod.FS.readFile(wasmOut);
        await fs.writeFile(outPath, outBuffer);
        return { stdout, stderr };
      }
    } catch {}
    throw new AppError(qpdfMessage(stderr || error.message, fallback), 400);
  }
}

export async function runQpdf(args, fallback = "QPDF could not process this PDF.") {
  if (!systemStatus.qpdf) {
    await detectSystemDependencies({ silent: true });
  }

  if (systemStatus.qpdfPath && systemStatus.qpdfVersion !== "WebAssembly WASM (Active)") {
    return new Promise((resolve, reject) => {
      const child = spawn(systemStatus.qpdfPath, args, { windowsHide: true });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      child.on("error", () => {
        runQpdfWasm(args, fallback).then(resolve).catch(reject);
      });
      child.on("close", (code) => {
        if (code === 0) return resolve({ stdout, stderr });
        reject(new AppError(qpdfMessage(stderr, fallback), 400));
      });
    });
  }

  return runQpdfWasm(args, fallback);
}

export async function isEncrypted(filePath) {
  try {
    const { stdout } = await runQpdf(["--show-encryption", filePath], "Could not inspect PDF encryption.");
    return !stdout.toLowerCase().includes("file is not encrypted");
  } catch (err) {
    if (err.message?.includes("encrypted") || err.message?.includes("password")) return true;
    return false;
  }
}
