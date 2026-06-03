import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import sharp from "sharp";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { outputPath, statSize, fileSnapshot } from "../../utils/fs.js";

function cleanName(name = "convilarge") {
  return String(name).replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "convilarge";
}

function wrapText(text, max = 92) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function writePdf({ title, sections, filename }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([612, 792]);
  let y = 742;
  const margin = 54;

  function nextPage() {
    page = pdf.addPage([612, 792]);
    y = 742;
  }

  function drawLine(line, { size = 10.5, font = regular, color = rgb(0.12, 0.16, 0.22), gap = 15 } = {}) {
    if (y < 54) nextPage();
    page.drawText(line, { x: margin, y, size, font, color, maxWidth: 504 });
    y -= gap;
  }

  drawLine(title, { size: 20, font: bold, gap: 26 });
  for (const section of sections) {
    if (section.heading) drawLine(section.heading, { size: 13, font: bold, color: rgb(0.08, 0.23, 0.36), gap: 18 });
    for (const paragraph of section.body || []) {
      const lines = wrapText(paragraph);
      lines.forEach((line) => drawLine(line));
      y -= 5;
    }
  }

  const out = outputPath(".pdf");
  await fs.writeFile(out, await pdf.save({ useObjectStreams: true }));
  return fileSnapshot(out, filename, "application/pdf", await statSize(out));
}

function escapeXml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function writeDocx({ title, sections, filename }) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const paragraphs = [
    `<w:p><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r></w:p>`,
    ...sections.flatMap((section) => [
      section.heading ? `<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(section.heading)}</w:t></w:r></w:p>` : "",
      ...(section.body || []).map((item) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(item)}</w:t></w:r></w:p>`)
    ]).filter(Boolean)
  ].join("");

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);

  const out = outputPath(".docx");
  await fs.writeFile(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  return fileSnapshot(out, filename, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", await statSize(out));
}

async function zipFiles(files, filename) {
  const out = outputPath(".zip");
  const archive = archiver("zip", { zlib: { level: 9 } });
  const handle = await fs.open(out, "w");
  const stream = handle.createWriteStream();
  archive.pipe(stream);
  files.forEach((file) => archive.file(file.path, { name: file.name || file.originalName }));
  await archive.finalize();
  await new Promise((resolve, reject) => {
    stream.on("close", resolve);
    archive.on("error", reject);
  });
  await handle.close();
  return fileSnapshot(out, filename, "application/zip", await statSize(out));
}

function paragraphsFromText(text) {
  return String(text || "").split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

export async function createTranslationArtifact({ output, sourceFile }) {
  const extension = path.extname(sourceFile.originalname).toLowerCase();
  const base = cleanName(path.parse(sourceFile.originalname).name);
  const title = output.translatedTitle || `${base} translation`;
  const sections = [{ heading: `${output.sourceLanguage || "Detected"} to ${output.targetLanguage || "Target"}`, body: paragraphsFromText(output.translatedText || output.text) }];

  if (extension === ".txt") {
    const out = outputPath(".txt");
    await fs.writeFile(out, output.translatedText || output.text || "", "utf8");
    return fileSnapshot(out, `${base}-translated.txt`, "text/plain", await statSize(out));
  }

  if (extension === ".pdf") return writePdf({ title, sections, filename: `${base}-translated.pdf` });
  return writeDocx({ title, sections, filename: `${base}-translated.docx` });
}

export async function createQuizArtifacts({ output }) {
  const title = output.title || "Generated Quiz";
  const questions = output.questions || [];
  const questionSections = [{
    heading: `${output.difficulty || "Medium"} quiz`,
    body: questions.map((item) => {
      const options = item.options?.length ? ` Options: ${item.options.join(" | ")}` : "";
      return `${item.id}. [${item.type}] ${item.question}${options}`;
    })
  }];
  const answerSections = [{
    heading: "Answer Key",
    body: questions.map((item) => `${item.id}. ${item.answer}${item.explanation ? ` - ${item.explanation}` : ""}`)
  }];

  const [quizPdf, quizDocx, answerPdf] = await Promise.all([
    writePdf({ title, sections: questionSections, filename: "ai-generated-quiz.pdf" }),
    writeDocx({ title, sections: [...questionSections, ...answerSections], filename: "ai-generated-quiz.docx" }),
    writePdf({ title: `${title} - Answer Sheet`, sections: answerSections, filename: "ai-generated-answer-sheet.pdf" })
  ]);

  return zipFiles([
    { path: quizPdf.path, name: quizPdf.originalName },
    { path: quizDocx.path, name: quizDocx.originalName },
    { path: answerPdf.path, name: answerPdf.originalName }
  ], "ai-quiz-exports.zip");
}

async function imageWithBackground(buffer, background, customFile, options = {}) {
  if (background === "transparent") return sharp(buffer).png().toBuffer();
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 1;
  const height = meta.height || 1;
  let bgInput;
  if (background === "custom" && customFile) {
    bgInput = await sharp(customFile.path).resize(width, height, { fit: "cover" }).png().toBuffer();
  } else {
    const color = background === "black" ? "#000000" : background === "solid" ? options.backgroundColor || "#ffffff" : "#ffffff";
    bgInput = await sharp({ create: { width, height, channels: 4, background: color } }).png().toBuffer();
  }
  return sharp(bgInput).composite([{ input: buffer }]).png({ compressionLevel: 9 }).toBuffer();
}

async function removeBackgroundOne(file, options, customBgFile) {
  const image = sharp(file.path).rotate().ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const samples = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 60));
  for (let x = 0; x < width; x += step) {
    samples.push((x * 4), ((height - 1) * width + x) * 4);
  }
  for (let y = 0; y < height; y += step) {
    samples.push((y * width) * 4, (y * width + width - 1) * 4);
  }
  const bg = samples.reduce((sum, index) => [sum[0] + data[index], sum[1] + data[index + 1], sum[2] + data[index + 2]], [0, 0, 0]).map((value) => value / samples.length);
  const tolerance = Number(options.tolerance || 34);
  for (let i = 0; i < data.length; i += 4) {
    const distance = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (distance < tolerance) data[i + 3] = 0;
    else if (distance < tolerance * 1.8) data[i + 3] = Math.round(((distance - tolerance) / (tolerance * 0.8)) * 255);
  }
  const transparent = await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
  const final = await imageWithBackground(transparent, options.backgroundMode || "transparent", customBgFile, options);
  const out = outputPath(".png");
  await fs.writeFile(out, final);
  return { path: out, name: `${cleanName(path.parse(file.originalname).name)}-background-removed.png` };
}

export async function createBackgroundRemovalArtifact(files, options = {}) {
  const imageFiles = files.filter((file) => file.mimetype.startsWith("image/"));
  const customBgFile = options.backgroundMode === "custom" ? imageFiles[imageFiles.length - 1] : null;
  const sourceFiles = customBgFile ? imageFiles.slice(0, -1) : imageFiles;
  const outputs = [];
  for (const file of sourceFiles) outputs.push(await removeBackgroundOne(file, options, customBgFile));
  if (outputs.length === 1) return fileSnapshot(outputs[0].path, outputs[0].name, "image/png", await statSize(outputs[0].path));
  return zipFiles(outputs, "background-removed-images.zip");
}

export async function createUpscaleArtifact(files, options = {}) {
  const factor = Math.min(8, Math.max(2, Number(options.scale || 2)));
  const outputs = [];
  for (const file of files) {
    const meta = await sharp(file.path).metadata();
    const out = outputPath(".png");
    await sharp(file.path)
      .rotate()
      .resize((meta.width || 1) * factor, (meta.height || 1) * factor, { kernel: "lanczos3" })
      .sharpen({ sigma: 1.1, m1: 0.6, m2: 2.2 })
      .png({ compressionLevel: 9 })
      .toFile(out);
    outputs.push({ path: out, name: `${cleanName(path.parse(file.originalname).name)}-${factor}x.png` });
  }
  if (outputs.length === 1) return fileSnapshot(outputs[0].path, outputs[0].name, "image/png", await statSize(outputs[0].path));
  return zipFiles(outputs, "upscaled-images.zip");
}

export async function createEnhanceArtifact(files, options = {}) {
  const strength = Math.min(100, Math.max(0, Number(options.strength || 55))) / 100;
  const outputs = [];
  for (const file of files) {
    const out = outputPath(".png");
    let pipeline = sharp(file.path).rotate();
    if (options.noiseReduction === "true" || options.restore === "true") pipeline = pipeline.median(Math.max(1, Math.round(1 + strength)));
    pipeline = pipeline
      .modulate({
        brightness: 1 + 0.08 * strength,
        saturation: 1 + 0.2 * strength
      })
      .linear(1 + 0.12 * strength, -5 * strength);
    if (options.sharpen !== "false") pipeline = pipeline.sharpen({ sigma: 0.8 + strength, m1: 0.5, m2: 1.8 });
    await pipeline.png({ compressionLevel: 9 }).toFile(out);
    outputs.push({ path: out, name: `${cleanName(path.parse(file.originalname).name)}-enhanced.png` });
  }
  if (outputs.length === 1) return fileSnapshot(outputs[0].path, outputs[0].name, "image/png", await statSize(outputs[0].path));
  return zipFiles(outputs, "enhanced-images.zip");
}
