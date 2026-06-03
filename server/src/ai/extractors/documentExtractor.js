import fs from "fs/promises";
import path from "path";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { compactWhitespace, clampText } from "../utils/chunkText.js";
import { hashText } from "../utils/hash.js";

async function extractPdf(filePath) {
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = await fs.readFile(filePath);
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

async function extractTxt(filePath) {
  return {
    text: await fs.readFile(filePath, "utf8"),
    pageCount: null
  };
}

export async function extractDocumentText(file) {
  const extension = path.extname(file.originalname || file.path).toLowerCase();
  let result;

  if (file.mimetype === "application/pdf" || extension === ".pdf") {
    result = await extractPdf(file.path);
  } else if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    result = await extractDocx(file.path);
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
