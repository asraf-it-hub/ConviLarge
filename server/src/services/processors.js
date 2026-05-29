import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import archiver from "archiver";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { fileSnapshot, outputPath, statSize } from "../utils/fs.js";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

function qualityFromLevel(level = "balanced") {
  return { low: 88, balanced: 76, high: 58 }[level] || 76;
}

async function zipFiles(files, name = "convilarge-output.zip") {
  const out = outputPath(".zip");
  const archive = archiver("zip", { zlib: { level: 9 } });
  const target = await fs.open(out, "w");
  const stream = target.createWriteStream();
  archive.pipe(stream);
  files.forEach((file) => archive.file(file.path, { name: file.name }));
  await archive.finalize();
  await new Promise((resolve, reject) => {
    stream.on("close", resolve);
    archive.on("error", reject);
  });
  await target.close();
  return fileSnapshot(out, name, "application/zip", await statSize(out));
}

async function convertImage(file, format, mimetype) {
  const out = outputPath(format === "jpeg" ? ".jpg" : `.${format}`);
  let pipeline = sharp(file.path).rotate();
  if (format === "jpeg") pipeline = pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true });
  if (format === "png") pipeline = pipeline.png({ compressionLevel: 9 });
  if (format === "webp") pipeline = pipeline.webp({ quality: 88 });
  await pipeline.toFile(out);
  return fileSnapshot(out, `${path.parse(file.originalname).name}.${format === "jpeg" ? "jpg" : format}`, mimetype, await statSize(out));
}

async function imagesToPdf(files, outputName = "images.pdf") {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const normalized = await sharp(file.path).rotate().jpeg({ quality: 94 }).toBuffer();
    const image = await pdf.embedJpg(normalized);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const out = outputPath(".pdf");
  await fs.writeFile(out, await pdf.save({ useObjectStreams: true }));
  return fileSnapshot(out, outputName, "application/pdf", await statSize(out));
}

async function mergePdfs(files) {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const source = await PDFDocument.load(await fs.readFile(file.path), { ignoreEncryption: true });
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const out = outputPath(".pdf");
  await fs.writeFile(out, await merged.save({ useObjectStreams: true }));
  return fileSnapshot(out, "merged.pdf", "application/pdf", await statSize(out));
}

async function compressImages(files, level) {
  const quality = qualityFromLevel(level);
  const outputs = [];

  for (const file of files) {
    const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const out = outputPath(ext);
    let pipeline = sharp(file.path).rotate();
    if (file.mimetype === "image/png") pipeline = pipeline.png({ compressionLevel: level === "high" ? 9 : 7, quality });
    if (file.mimetype === "image/webp") pipeline = pipeline.webp({ quality });
    if (file.mimetype === "image/jpeg") pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    await pipeline.toFile(out);
    outputs.push({ path: out, name: `${path.parse(file.originalname).name}-compressed${ext}` });
  }

  return zipFiles(outputs, "compressed-images.zip");
}

async function compressPdf(file) {
  const source = await PDFDocument.load(await fs.readFile(file.path), { ignoreEncryption: true });
  const out = outputPath(".pdf");
  await fs.writeFile(out, await source.save({ useObjectStreams: true, addDefaultPage: false }));
  return fileSnapshot(out, `${path.parse(file.originalname).name}-compressed.pdf`, "application/pdf", await statSize(out));
}

function parseRange(range, pageCount) {
  const selected = new Set();
  const parts = String(range || `1-${pageCount}`).split(",");

  for (const part of parts) {
    const token = part.trim();
    if (!token) continue;
    const [startRaw, endRaw] = token.split("-");
    const start = Number(startRaw);
    const end = Number(endRaw || startRaw);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > pageCount || start > end) {
      throw new AppError(`Invalid page range. Use values between 1 and ${pageCount}.`);
    }
    for (let index = start; index <= end; index += 1) selected.add(index - 1);
  }

  return [...selected].sort((a, b) => a - b);
}

async function splitPdf(file, range) {
  const source = await PDFDocument.load(await fs.readFile(file.path), { ignoreEncryption: true });
  const selected = parseRange(range, source.getPageCount());
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, selected);
  pages.forEach((page) => output.addPage(page));
  const out = outputPath(".pdf");
  await fs.writeFile(out, await output.save({ useObjectStreams: true }));
  return fileSnapshot(out, "split-pages.pdf", "application/pdf", await statSize(out));
}

async function pdfToJpg(file) {
  const outputs = [];
  try {
    const image = sharp(file.path, { density: 180 });
    const meta = await image.metadata();
    const pages = meta.pages || 1;
    for (let page = 0; page < pages; page += 1) {
      const out = outputPath(".jpg");
      await sharp(file.path, { density: 180, page }).jpeg({ quality: 90 }).toFile(out);
      outputs.push({ path: out, name: `page-${page + 1}.jpg` });
    }
  } catch (error) {
    throw new AppError(
      "PDF to JPG needs PDF rendering support in Sharp/libvips on this machine. Install Poppler/Ghostscript support or use a deployment image that includes it.",
      501,
      error.message
    );
  }
  return zipFiles(outputs, "pdf-pages-jpg.zip");
}

async function mp4ToMp3(file) {
  const out = outputPath(".mp3");
  await new Promise((resolve, reject) => {
    ffmpeg(file.path)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate("192k")
      .format("mp3")
      .on("end", resolve)
      .on("error", reject)
      .save(out);
  });
  return fileSnapshot(out, `${path.parse(file.originalname).name}.mp3`, "audio/mpeg", await statSize(out));
}

function runQpdf(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(env.qpdfPath, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", () => {
      reject(new AppError("PDF lock/unlock requires qpdf. Set QPDF_PATH or install qpdf on the server.", 501));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new AppError(stderr || "qpdf failed to process this PDF", 400));
    });
  });
}

async function lockPdf(file, password) {
  if (!password || password.length < 4) throw new AppError("Password must be at least 4 characters.");
  const out = outputPath(".pdf");
  await runQpdf(["--encrypt", password, password, "256", "--", file.path, out]);
  return fileSnapshot(out, "locked.pdf", "application/pdf", await statSize(out));
}

async function unlockPdf(file, password) {
  const out = outputPath(".pdf");
  const args = password ? [`--password=${password}`, "--decrypt", file.path, out] : ["--decrypt", file.path, out];
  await runQpdf(args);
  return fileSnapshot(out, "unlocked.pdf", "application/pdf", await statSize(out));
}

export async function processTool(toolType, files, options = {}) {
  switch (toolType) {
    case "jpg-to-png":
      return convertImage(files[0], "png", "image/png");
    case "png-to-jpg":
      return convertImage(files[0], "jpeg", "image/jpeg");
    case "png-to-webp":
      return convertImage(files[0], "webp", "image/webp");
    case "webp-to-png":
      return convertImage(files[0], "png", "image/png");
    case "jpg-to-pdf":
    case "images-to-pdf":
      return imagesToPdf(files, toolType === "jpg-to-pdf" ? "converted.pdf" : "images.pdf");
    case "pdf-to-jpg":
      return pdfToJpg(files[0]);
    case "mp4-to-mp3":
      return mp4ToMp3(files[0]);
    case "merge-pdfs":
      return mergePdfs(files);
    case "compress-images":
      return compressImages(files, options.level);
    case "compress-pdf":
      return compressPdf(files[0]);
    case "split-pdf":
      return splitPdf(files[0], options.pageRange);
    case "lock-pdf":
      return lockPdf(files[0], options.password);
    case "unlock-pdf":
      return unlockPdf(files[0], options.password);
    default:
      throw new AppError("Unknown tool", 404);
  }
}
