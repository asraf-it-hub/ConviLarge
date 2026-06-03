import fs from "fs/promises";

export async function imageDataUrl(file) {
  const buffer = await fs.readFile(file.path);
  return `data:${file.mimetype};base64,${buffer.toString("base64")}`;
}

export async function geminiInlineData(file) {
  const buffer = await fs.readFile(file.path);
  return {
    inlineData: {
      mimeType: file.mimetype,
      data: buffer.toString("base64")
    }
  };
}
