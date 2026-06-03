import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { compactWhitespace, clampText } from "../utils/chunkText.js";
import { hashText } from "../utils/hash.js";

function parsePageRange(range, pageCount) {
  if (!range) return null;
  const selected = new Set();
  for (const part of String(range).split(",")) {
    const token = part.trim();
    if (!token) continue;
    const [startRaw, endRaw] = token.split("-");
    const start = Number(startRaw);
    const end = Number(endRaw || startRaw);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > pageCount || start > end) {
      throw new AppError(`Invalid page range. Use values between 1 and ${pageCount}.`);
    }
    for (let page = start; page <= end; page += 1) selected.add(page - 1);
  }
  return selected.size ? [...selected].sort((a, b) => a - b) : null;
}

async function selectedPdfBuffer(filePath, pageRange) {
  if (!pageRange) return fs.readFile(filePath);
  const source = await PDFDocument.load(await fs.readFile(filePath), { ignoreEncryption: true });
  const selected = parsePageRange(pageRange, source.getPageCount());
  if (!selected) return fs.readFile(filePath);
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, selected);
  pages.forEach((page) => output.addPage(page));
  return Buffer.from(await output.save({ useObjectStreams: true }));
}

async function extractPdf(filePath, options = {}) {
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = await selectedPdfBuffer(filePath, options.pageRange);
  const result = await pdfParse(buffer);
  return {
    text: result.text || "",
    pageCount: result.numpages || null
  };
}

async function extractDocx(filePath) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return {
    text: result.value || "",
    pageCount: null
  };
}

async function extractPptx(filePath) {
  const JSZip = (await import("jszip")).default;
  const input = await fs.readFile(filePath);
  const zip = JSZip.loadAsync ? await JSZip.loadAsync(input) : JSZip().load(input);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] || 0) - Number(b.match(/slide(\d+)/)?.[1] || 0));

  const slides = [];
  for (const name of slideNames) {
    const xml = zip.files[name].async ? await zip.files[name].async("string") : zip.files[name].asText();
    const text = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
      .map((match) => match[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))
      .join(" ");
    if (text.trim()) slides.push(`Slide ${slides.length + 1}: ${text}`);
  }

  return {
    text: slides.join("\n\n"),
    pageCount: slideNames.length || null
  };
}

async function extractTxt(filePath) {
  return {
    text: await fs.readFile(filePath, "utf8"),
    pageCount: null
  };
}

export async function extractDocumentText(file, options = {}) {
  const extension = path.extname(file.originalname || file.path).toLowerCase();
  let result;

  if (file.mimetype === "application/pdf" || extension === ".pdf") {
    result = await extractPdf(file.path, options);
  } else if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    result = await extractDocx(file.path);
  } else if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    extension === ".pptx"
  ) {
    result = await extractPptx(file.path);
  } else if (file.mimetype === "text/plain" || extension === ".txt") {
    result = await extractTxt(file.path);
  } else {
    throw new AppError("This AI tool cannot read that document type yet.");
  }

  const text = clampText(compactWhitespace(result.text), env.aiMaxTextChars);
  if (!text) {
    throw new AppError("No readable text was found. Try AI OCR for scanned pages or image-based files.");
  }

  return {
    ...result,
    text,
    textHash: hashText(text)
  };
}
