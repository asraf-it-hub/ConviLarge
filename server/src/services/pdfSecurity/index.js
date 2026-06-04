import fs from "fs/promises";
import path from "path";
import { PDFDocument, PDFName } from "pdf-lib";
import { AppError } from "../../utils/errors.js";
import { fileSnapshot, outputPath, statSize } from "../../utils/fs.js";
import { isEncrypted, runQpdf } from "./qpdf.js";

const metadataKeys = [
  ["title", "Title"],
  ["author", "Author"],
  ["subject", "Subject"],
  ["keywords", "Keywords"],
  ["creator", "Creator"],
  ["producer", "Producer"],
  ["creationDate", "Creation Date"],
  ["modificationDate", "Modification Date"]
];

const removableInfoKeys = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer"];

function cleanPassword(value) {
  return String(value || "");
}

function validatePdfFile(file) {
  if (!file?.path) throw new AppError("Upload one PDF file.");
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (file.mimetype !== "application/pdf" && extension !== ".pdf") {
    throw new AppError("Upload a valid PDF file.");
  }
}

export function validateLockPassword(password, confirmation) {
  const value = cleanPassword(password);
  if (!value.trim()) throw new AppError("Enter a password to protect the PDF.");
  if (confirmation !== undefined && value !== cleanPassword(confirmation)) {
    throw new AppError("Password and confirmation do not match.");
  }
  if (value.length < 8) throw new AppError("Use at least 8 characters for the PDF password.");
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    throw new AppError("Use uppercase, lowercase, and a number in the PDF password.");
  }
}

function parsePdfVersion(buffer) {
  const header = buffer.subarray(0, 1024).toString("latin1");
  return header.match(/%PDF-(\d\.\d)/)?.[1] || "Unknown";
}

function formatDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : "";
}

function normalizeKeywords(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "";
}

async function loadPdf(file, options = {}) {
  try {
    return await PDFDocument.load(await fs.readFile(file.path), options);
  } catch (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("encrypted")) {
      throw new AppError("This PDF is encrypted. Unlock it first, then try again.");
    }
    throw new AppError("This file does not look like a valid PDF. Please upload a different PDF.");
  }
}

export async function lockPdf(file, options = {}) {
  validatePdfFile(file);
  validateLockPassword(options.password, options.confirmPassword);

  const out = outputPath(".pdf");
  await runQpdf(
    ["--encrypt", cleanPassword(options.password), cleanPassword(options.password), "256", "--", file.path, out],
    "Could not lock this PDF. Please check that it is a valid PDF."
  );

  return fileSnapshot(out, `${path.parse(file.originalname).name || "locked"}-locked.pdf`, "application/pdf", await statSize(out));
}

export async function unlockPdf(file, options = {}) {
  validatePdfFile(file);
  const password = cleanPassword(options.password);
  if (!password) throw new AppError("Enter the PDF password to unlock this file.");

  if (!(await isEncrypted(file.path))) {
    throw new AppError("This PDF is not password protected.");
  }

  const out = outputPath(".pdf");
  await runQpdf(
    [`--password=${password}`, "--decrypt", file.path, out],
    "Could not unlock this PDF. Please check the password and try again."
  );

  return fileSnapshot(out, `${path.parse(file.originalname).name || "unlocked"}-unlocked.pdf`, "application/pdf", await statSize(out));
}

export async function getMetadata(file) {
  validatePdfFile(file);
  const buffer = await fs.readFile(file.path);
  const pdf = await loadPdf(file, { ignoreEncryption: false, updateMetadata: false });

  return {
    fields: {
      title: pdf.getTitle() || "",
      author: pdf.getAuthor() || "",
      subject: pdf.getSubject() || "",
      keywords: normalizeKeywords(pdf.getKeywords()),
      creator: pdf.getCreator() || "",
      producer: pdf.getProducer() || "",
      creationDate: formatDate(pdf.getCreationDate()),
      modificationDate: formatDate(pdf.getModificationDate()),
      pdfVersion: parsePdfVersion(buffer),
      pageCount: pdf.getPageCount(),
      fileSize: await statSize(file.path)
    },
    labels: Object.fromEntries([
      ...metadataKeys,
      ["pdfVersion", "PDF Version"],
      ["pageCount", "Number of Pages"],
      ["fileSize", "File Size"]
    ])
  };
}

async function rebuildWithoutMetadata(file, out) {
  const source = await loadPdf(file, { ignoreEncryption: true, updateMetadata: false });
  const clean = await PDFDocument.create({ updateMetadata: false });
  const pages = await clean.copyPages(source, source.getPageIndices());
  pages.forEach((page) => clean.addPage(page));

  clean.setTitle("");
  clean.setAuthor("");
  clean.setSubject("");
  clean.setKeywords([]);
  clean.setCreator("");
  clean.setProducer("");
  const infoDict = clean.getInfoDict();
  removableInfoKeys.forEach((key) => infoDict.delete(PDFName.of(key)));
  clean.catalog.delete(PDFName.of("Metadata"));

  await fs.writeFile(out, await clean.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false }));
}

function hasMeaningfulMetadata(metadata) {
  const fields = metadata.fields || {};
  return ["title", "author", "subject", "keywords", "creator", "producer"].some((key) => String(fields[key] || "").trim());
}

export async function removeMetadata(file) {
  validatePdfFile(file);
  const out = outputPath(".pdf");

  await rebuildWithoutMetadata(file, out);
  const outputFile = { ...file, path: out, originalname: path.basename(out), mimetype: "application/pdf" };
  const verified = await getMetadata(outputFile);
  if (hasMeaningfulMetadata(verified)) {
    throw new AppError("Could not fully remove PDF metadata. Please try a different PDF.", 422);
  }

  return fileSnapshot(out, `${path.parse(file.originalname).name || "clean"}-metadata-cleaned.pdf`, "application/pdf", await statSize(out));
}
