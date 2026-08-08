import fs from "fs/promises";
import path from "path";
import util from "util";
import { createRequire } from "module";
import archiver from "archiver";
import ExcelJS from "exceljs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { degrees, PDFDocument, PDFName, PDFRawStream, rgb, StandardFonts } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { AppError } from "../utils/errors.js";
import { fileSnapshot, outputPath, statSize } from "../utils/fs.js";
import { getMetadata, lockPdf, removeMetadata, unlockPdf } from "./pdfSecurity/index.js";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
const ffprobePromise = util.promisify(ffmpeg.ffprobe);
const require = createRequire(import.meta.url);
const DocxMerger = require("docx-merger");
const heicConvert = require("heic-convert");

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

async function mergeImages(files) {
  const normalized = [];
  for (const file of files) {
    const image = sharp(file.path).rotate();
    const metadata = await image.metadata();
    normalized.push({
      input: await image.png().toBuffer(),
      width: metadata.width || 1,
      height: metadata.height || 1
    });
  }

  const width = Math.max(...normalized.map((image) => image.width));
  const height = normalized.reduce((sum, image) => sum + image.height, 0);
  let top = 0;
  const composite = normalized.map((image) => {
    const layer = { input: image.input, left: Math.floor((width - image.width) / 2), top };
    top += image.height;
    return layer;
  });

  const out = outputPath(".png");
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#ffffff"
    }
  })
    .composite(composite)
    .png({ compressionLevel: 9 })
    .toFile(out);

  return fileSnapshot(out, "merged-images.png", "image/png", await statSize(out));
}

function runFfmpeg(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject).run();
  });
}

async function mergeAudio(files) {
  const out = outputPath(".mp3");
  const command = ffmpeg();
  files.forEach((file) => command.input(file.path));
  const inputs = files.map((_, index) => `[${index}:a:0]`).join("");

  await runFfmpeg(
    command
      .complexFilter(`${inputs}concat=n=${files.length}:v=0:a=1[outa]`)
      .outputOptions(["-map [outa]", "-ac 2", "-ar 44100", "-b:a 192k"])
      .format("mp3")
      .output(out)
  );

  return fileSnapshot(out, "merged-audio.mp3", "audio/mpeg", await statSize(out));
}

async function mergeVideo(files) {
  const out = outputPath(".mp4");
  const listFile = outputPath(".txt");

  const fileListContent = files
    .map((f) => `file '${f.path.replace(/\\/g, "/")}'`)
    .join("\n");

  await fs.writeFile(listFile, fileListContent, "utf8");

  try {
    const command = ffmpeg();
    await runFfmpeg(
      command
        .input(listFile)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions([
          "-c:v libx264",
          "-preset ultrafast",
          "-crf 26",
          "-c:a aac",
          "-b:a 128k",
          "-movflags +faststart"
        ])
        .output(out)
    );
  } catch (error) {
    throw new AppError(`Video merge failed: ${error.message || "Failed to combine video files"}`);
  } finally {
    await fs.unlink(listFile).catch(() => {});
  }

  return fileSnapshot(out, "merged-video.mp4", "video/mp4", await statSize(out));
}

function clonePlain(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function safeSheetName(name, usedNames) {
  const base = String(name || "Sheet").replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  let suffix = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    const marker = ` (${suffix})`;
    candidate = `${base.slice(0, 31 - marker.length)}${marker}`;
    suffix += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function copyWorksheet(source, target) {
  target.properties = clonePlain(source.properties) || target.properties;
  target.pageSetup = clonePlain(source.pageSetup) || target.pageSetup;
  target.views = clonePlain(source.views) || [];
  target.headerFooter = clonePlain(source.headerFooter) || {};
  target.state = source.state;

  source.columns.forEach((column, index) => {
    const targetColumn = target.getColumn(index + 1);
    targetColumn.width = column.width;
    targetColumn.hidden = column.hidden;
    targetColumn.outlineLevel = column.outlineLevel;
    targetColumn.style = clonePlain(column.style) || {};
  });

  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const targetRow = target.getRow(rowNumber);
    targetRow.height = row.height;
    targetRow.hidden = row.hidden;
    targetRow.outlineLevel = row.outlineLevel;
    targetRow.style = clonePlain(row.style) || {};

    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const targetCell = targetRow.getCell(columnNumber);
      targetCell.value = clonePlain(cell.value);
      targetCell.style = clonePlain(cell.style) || {};
      if (cell.numFmt) targetCell.numFmt = cell.numFmt;
      if (cell.note) targetCell.note = clonePlain(cell.note);
    });
    targetRow.commit();
  });

  for (const merge of source.model.merges || []) {
    target.mergeCells(merge);
  }
}

async function mergeExcel(files) {
  const output = new ExcelJS.Workbook();
  output.creator = "ConviLarge";
  output.created = new Date();
  output.modified = new Date();
  const defaultSheet = output.getWorksheet(1);
  if (defaultSheet) output.removeWorksheet(defaultSheet.id);
  const usedNames = new Set();

  for (const file of files) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    workbook.eachSheet((worksheet) => {
      const nextSheet = output.addWorksheet(safeSheetName(worksheet.name, usedNames));
      copyWorksheet(worksheet, nextSheet);
    });
  }

  const out = outputPath(".xlsx");
  await output.xlsx.writeFile(out);
  return fileSnapshot(out, "merged-workbook.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", await statSize(out));
}

async function mergeWord(files) {
  const buffers = await Promise.all(files.map((file) => fs.readFile(file.path)));
  const merger = new DocxMerger({ pageBreak: true }, buffers);
  const data = await new Promise((resolve) => merger.save("nodebuffer", resolve));
  const out = outputPath(".docx");
  await fs.writeFile(out, data);
  return fileSnapshot(out, "merged-document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", await statSize(out));
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

function positiveInt(value, fallback = null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

async function resizeImage(file, options) {
  const width = positiveInt(options.width);
  const height = positiveInt(options.height);
  if (!width && !height) throw new AppError("Enter a width or height to resize the image.");
  const out = outputPath(".png");
  await sharp(file.path)
    .rotate()
    .resize({ width, height, fit: options.keepAspect === "false" ? "fill" : "inside", withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(out);
  return fileSnapshot(out, "resized-image.png", "image/png", await statSize(out));
}

async function cropImage(file, options) {
  const metadata = await sharp(file.path).metadata();
  const left = Math.max(0, Number(options.cropX || 0));
  const top = Math.max(0, Number(options.cropY || 0));
  const width = positiveInt(options.cropWidth);
  const height = positiveInt(options.cropHeight);
  if (!width || !height) throw new AppError("Enter crop width and crop height.");
  if (left + width > metadata.width || top + height > metadata.height) {
    throw new AppError(`Crop area must fit inside the image (${metadata.width}x${metadata.height}).`);
  }
  const out = outputPath(".png");
  await sharp(file.path).rotate().extract({ left, top, width, height }).png({ compressionLevel: 9 }).toFile(out);
  return fileSnapshot(out, "cropped-image.png", "image/png", await statSize(out));
}

async function heicToJpg(file) {
  const inputBuffer = await fs.readFile(file.path);
  const outputBuffer = await heicConvert({ buffer: inputBuffer, format: "JPEG", quality: 0.92 });
  const out = outputPath(".jpg");
  await fs.writeFile(out, Buffer.from(outputBuffer));
  return fileSnapshot(out, `${path.parse(file.originalname).name}.jpg`, "image/jpeg", await statSize(out));
}

async function removeBackground() {
  throw new AppError(
    "Remove Background is temporarily unavailable due to high traffic. Please try again later.",
    503
  );
}

async function compressPdf(file, level = "balanced") {
  const qualityMap = {
    low: { quality: 82, maxDim: 1600 },
    light: { quality: 82, maxDim: 1600 },
    balanced: { quality: 58, maxDim: 1100 },
    high: { quality: 38, maxDim: 750 },
    smallest: { quality: 32, maxDim: 650 }
  };

  const settings = qualityMap[level] || qualityMap.balanced;
  const pdfBytes = await fs.readFile(file.path);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const indirectObjects = pdfDoc.context.enumerateIndirectObjects();

  for (const [ref, obj] of indirectObjects) {
    if (obj instanceof PDFRawStream) {
      const dict = obj.dict;
      const subtype = dict.get(PDFName.of("Subtype"));
      if (subtype?.toString() === "/Image") {
        try {
          const imageBytes = obj.contents;
          let pipeline = sharp(Buffer.from(imageBytes)).rotate();
          const meta = await pipeline.metadata();

          if (meta.width && meta.height) {
            if (meta.width > settings.maxDim || meta.height > settings.maxDim) {
              pipeline = pipeline.resize({
                width: meta.width > settings.maxDim ? settings.maxDim : undefined,
                height: meta.height > settings.maxDim ? settings.maxDim : undefined,
                fit: "inside",
                withoutEnlargement: true
              });
            }

            const compressedJpg = await pipeline
              .jpeg({ quality: settings.quality, mozjpeg: true })
              .toBuffer();

            const embeddedJpg = await pdfDoc.embedJpg(compressedJpg);
            pdfDoc.context.assign(ref, embeddedJpg.ref);
          }
        } catch {
          // Keep original image stream if re-encoding fails
        }
      }
    }
  }

  const out = outputPath(".pdf");
  const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  await fs.writeFile(out, compressedPdfBytes);

  return fileSnapshot(
    out,
    `${path.parse(file.originalname).name}-${level || "compressed"}.pdf`,
    "application/pdf",
    await statSize(out)
  );
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

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function hexToRgb(hex, fallback = "#808080") {
  const normalized = String(hex || fallback).trim().replace(/^#/, "");
  const value = /^[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback.replace(/^#/, "");
  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
}

function textWatermarkPreset(name) {
  const presets = {
    professional: { color: "#808080", opacity: 15, rotation: 45 },
    confidential: { color: "#c94a4a", opacity: 12, rotation: 45 },
    brand: { color: "#808080", opacity: 10, rotation: 0 }
  };
  return presets[String(name || "professional").toLowerCase()] || presets.professional;
}

function rotatedOriginForCenter(centerX, centerY, boxWidth, boxHeight, angle) {
  const radians = (angle * Math.PI) / 180;
  const localCenterX = boxWidth / 2;
  const localCenterY = boxHeight / 2;
  return {
    x: centerX - (localCenterX * Math.cos(radians) - localCenterY * Math.sin(radians)),
    y: centerY - (localCenterX * Math.sin(radians) + localCenterY * Math.cos(radians))
  };
}

function rotatedBounds(width, height, angle) {
  const radians = Math.abs((angle * Math.PI) / 180);
  return {
    width: Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)),
    height: Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians))
  };
}

function fitWatermarkText(text, font, pageWidth, pageHeight, rotation, presetName) {
  const margin = Math.max(36, Math.min(pageWidth, pageHeight) * 0.08);
  const availableWidth = Math.max(1, pageWidth - margin * 2);
  const availableHeight = Math.max(1, pageHeight - margin * 2);
  const diagonal = Math.hypot(availableWidth, availableHeight);
  const targetWidth = diagonal * (presetName === "confidential" ? 0.68 : 0.55);
  let size = Math.min(Math.max(28, Math.min(pageWidth, pageHeight) * 0.13), targetWidth / Math.max(font.widthOfTextAtSize(text, 1), 1));

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const width = font.widthOfTextAtSize(text, size);
    const height = size * 0.78;
    const bounds = rotatedBounds(width, height, rotation);
    if (bounds.width <= availableWidth && bounds.height <= availableHeight) return { size, width, height };
    size *= Math.min(availableWidth / bounds.width, availableHeight / bounds.height) * 0.96;
  }

  const width = font.widthOfTextAtSize(text, size);
  return { size, width, height: size * 0.78 };
}

function imagePlacement(position, pageWidth, pageHeight, imageWidth, imageHeight, rotation) {
  const margin = Math.max(28, Math.min(pageWidth, pageHeight) * 0.055);
  const bounds = rotatedBounds(imageWidth, imageHeight, rotation);
  let centerX = pageWidth / 2;
  let centerY = pageHeight / 2;

  if (position.includes("left")) centerX = margin + bounds.width / 2;
  if (position.includes("right")) centerX = pageWidth - margin - bounds.width / 2;
  if (position.includes("top")) centerY = pageHeight - margin - bounds.height / 2;
  if (position.includes("bottom")) centerY = margin + bounds.height / 2;

  return rotatedOriginForCenter(centerX, centerY, imageWidth, imageHeight, rotation);
}

async function embedWatermarkImage(pdf, logoFile) {
  if (!logoFile) return null;
  const extension = path.extname(logoFile.originalname).toLowerCase();
  const input = await fs.readFile(logoFile.path);
  if (logoFile.mimetype === "image/jpeg" || [".jpg", ".jpeg"].includes(extension)) return pdf.embedJpg(input);
  if (logoFile.mimetype === "image/png" || extension === ".png") return pdf.embedPng(input);
  const png = await sharp(input, { density: 240 }).png().toBuffer();
  return pdf.embedPng(png);
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

async function rotatePdf(file, options) {
  const source = await PDFDocument.load(await fs.readFile(file.path), { ignoreEncryption: true });
  const selected = options.pageRange ? parseRange(options.pageRange, source.getPageCount()) : source.getPageIndices();
  const angle = Number(options.angle || 90);
  if (![90, 180, 270].includes(angle)) throw new AppError("Rotation angle must be 90, 180, or 270 degrees.");
  selected.forEach((pageIndex) => {
    const page = source.getPage(pageIndex);
    const current = page.getRotation().angle || 0;
    page.setRotation(degrees((current + angle) % 360));
  });
  const out = outputPath(".pdf");
  await fs.writeFile(out, await source.save({ useObjectStreams: true }));
  return fileSnapshot(out, "rotated.pdf", "application/pdf", await statSize(out));
}

async function removePdfPages(file, range) {
  const source = await PDFDocument.load(await fs.readFile(file.path), { ignoreEncryption: true });
  const removeSet = new Set(parseRange(range, source.getPageCount()));
  const keep = source.getPageIndices().filter((index) => !removeSet.has(index));
  if (!keep.length) throw new AppError("At least one page must remain in the PDF.");
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, keep);
  pages.forEach((page) => output.addPage(page));
  const out = outputPath(".pdf");
  await fs.writeFile(out, await output.save({ useObjectStreams: true }));
  return fileSnapshot(out, "pages-removed.pdf", "application/pdf", await statSize(out));
}

async function watermarkPdf(files, options) {
  const pdfFile = files.find((item) => item.mimetype === "application/pdf" || path.extname(item.originalname).toLowerCase() === ".pdf");
  const logoFile = files.find((item) => item !== pdfFile);
  const text = String(options.watermarkText || "").trim();
  if (!pdfFile) throw new AppError("Add one PDF file to watermark.");
  if (!text && !logoFile) throw new AppError("Enter watermark text or add a PNG, JPG, or SVG logo.");

  const pdf = await PDFDocument.load(await fs.readFile(pdfFile.path), { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedWatermarkImage(pdf, logoFile);
  const selectedPages = options.pageRange ? new Set(parseRange(options.pageRange, pdf.getPageCount())) : null;
  const presetName = String(options.watermarkPreset || "professional").toLowerCase();
  const preset = textWatermarkPreset(presetName);
  const textOpacity = clampNumber(options.watermarkTextOpacity, 5, 100, preset.opacity) / 100;
  const textRotation = clampNumber(options.watermarkTextRotation, -90, 90, preset.rotation);
  const imageOpacity = clampNumber(options.watermarkImageOpacity, 5, 100, presetName === "brand" ? 10 : 15) / 100;
  const imageScale = clampNumber(options.watermarkImageScale, 5, 60, presetName === "brand" ? 14 : 25);
  const imageRotation = clampNumber(options.watermarkImageRotation, -180, 180, 0);
  const imagePosition = ["center", "top-left", "top-right", "bottom-left", "bottom-right"].includes(options.watermarkImagePosition)
    ? options.watermarkImagePosition
    : presetName === "brand"
      ? "bottom-right"
      : "center";
  const logoText = String(options.watermarkLogoText || "").trim();

  pdf.getPages().forEach((page, pageIndex) => {
    if (selectedPages && !selectedPages.has(pageIndex)) return;
    const { width, height } = page.getSize();

    if (text) {
      const metrics = fitWatermarkText(text, font, width, height, textRotation, presetName);
      const origin = rotatedOriginForCenter(width / 2, height / 2, metrics.width, metrics.height, textRotation);
      page.drawText(text, {
        x: origin.x,
        y: origin.y,
        size: metrics.size,
        font,
        color: hexToRgb(options.watermarkTextColor, preset.color),
        opacity: textOpacity,
        rotate: degrees(textRotation)
      });
    }

    if (logo) {
      const margin = Math.max(28, Math.min(width, height) * 0.055);
      const aspect = logo.height / logo.width;
      let imageWidth = width * (imageScale / 100);
      let imageHeight = imageWidth * aspect;
      const bounds = rotatedBounds(imageWidth, imageHeight, imageRotation);
      const fitRatio = Math.min(1, (width - margin * 2) / bounds.width, (height - margin * 2) / bounds.height);
      imageWidth *= fitRatio;
      imageHeight *= fitRatio;
      const origin = imagePlacement(imagePosition, width, height, imageWidth, imageHeight, imageRotation);
      page.drawImage(logo, {
        x: origin.x,
        y: origin.y,
        width: imageWidth,
        height: imageHeight,
        opacity: imageOpacity,
        rotate: degrees(imageRotation)
      });

      if (logoText && imagePosition !== "center") {
        const labelSize = Math.max(8, Math.min(12, imageWidth * 0.12));
        const labelWidth = font.widthOfTextAtSize(logoText, labelSize);
        const labelX = Math.min(width - margin - labelWidth, Math.max(margin, origin.x + imageWidth - labelWidth));
        const labelY = Math.max(margin, origin.y - labelSize * 1.5);
        page.drawText(logoText, {
          x: labelX,
          y: labelY,
          size: labelSize,
          font,
          color: hexToRgb("#808080"),
          opacity: Math.min(imageOpacity + 0.05, 0.35)
        });
      }
    }
  });
  const out = outputPath(".pdf");
  await fs.writeFile(out, await pdf.save({ useObjectStreams: true }));
  return fileSnapshot(out, "watermarked.pdf", "application/pdf", await statSize(out));
}

async function numberPdfPages(file) {
  const pdf = await PDFDocument.load(await fs.readFile(file.path), { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const label = `${index + 1} / ${pages.length}`;
    page.drawText(label, {
      x: width / 2 - font.widthOfTextAtSize(label, 10) / 2,
      y: 24,
      size: 10,
      font,
      color: rgb(0.25, 0.28, 0.35)
    });
  });
  const out = outputPath(".pdf");
  await fs.writeFile(out, await pdf.save({ useObjectStreams: true }));
  return fileSnapshot(out, "numbered-pages.pdf", "application/pdf", await statSize(out));
}

async function pdfToJpg(file) {
  const outputs = [];
  try {
    const data = new Uint8Array(await fs.readFile(file.path));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const pdfPage = await pdf.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale: 2.0 });

      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");

      // Set solid white background for JPEG rendering
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      await pdfPage.render({ canvasContext: ctx, viewport }).promise;

      const jpgBuffer = await canvas.encode("jpeg", 90);
      const out = outputPath(".jpg");
      await fs.writeFile(out, jpgBuffer);
      outputs.push({ path: out, name: `page-${pageNum}.jpg` });
    }
  } catch (error) {
    throw new AppError(`PDF to JPG conversion failed: ${error.message}`);
  }

  if (outputs.length === 1) {
    return fileSnapshot(
      outputs[0].path,
      `${path.parse(file.originalname).name}.jpg`,
      "image/jpeg",
      await statSize(outputs[0].path)
    );
  }

  return zipFiles(outputs, `${path.parse(file.originalname).name}-jpg-pages.zip`);
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
    case "merge-images":
      return mergeImages(files);
    case "merge-audio":
      return mergeAudio(files);
    case "merge-video":
      return mergeVideo(files);
    case "merge-excel":
      return mergeExcel(files);
    case "merge-word":
      return mergeWord(files);
    case "resize-image":
      return resizeImage(files[0], options);
    case "crop-image":
      return cropImage(files[0], options);
    case "heic-to-jpg":
      return heicToJpg(files[0]);
    case "remove-background":
      return removeBackground(files[0]);
    case "compress-images":
      return compressImages(files, options.level);
    case "compress-pdf":
      return compressPdf(files[0], options.level);
    case "split-pdf":
      return splitPdf(files[0], options.pageRange);
    case "rotate-pdf":
      return rotatePdf(files[0], options);
    case "remove-pdf-pages":
      return removePdfPages(files[0], options.pageRange);
    case "extract-pdf-pages":
      return splitPdf(files[0], options.pageRange);
    case "watermark-pdf":
      return watermarkPdf(files, options);
    case "number-pdf-pages":
      return numberPdfPages(files[0]);
    case "lock-pdf":
      return lockPdf(files[0], options);
    case "unlock-pdf":
      return unlockPdf(files[0], options);
    case "view-pdf-metadata":
      return { kind: "metadata", metadata: await getMetadata(files[0]) };
    case "remove-pdf-metadata":
      return removeMetadata(files[0]);
    default:
      throw new AppError("Unknown tool", 404);
  }
}
