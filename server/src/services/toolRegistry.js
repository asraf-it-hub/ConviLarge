export const tools = {
  "jpg-to-png": {
    title: "JPG to PNG",
    category: "convert",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["image/jpeg"],
    output: "image/png"
  },
  "png-to-jpg": {
    title: "PNG to JPG",
    category: "convert",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["image/png"],
    output: "image/jpeg"
  },
  "png-to-webp": {
    title: "PNG to WEBP",
    category: "convert",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["image/png"],
    output: "image/webp"
  },
  "webp-to-png": {
    title: "WEBP to PNG",
    category: "convert",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["image/webp"],
    output: "image/png"
  },
  "jpg-to-pdf": {
    title: "JPG to PDF",
    category: "convert",
    minFiles: 1,
    maxFiles: 20,
    accepts: ["image/jpeg"],
    output: "application/pdf"
  },
  "pdf-to-jpg": {
    title: "PDF to JPG",
    category: "convert",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    output: "application/zip"
  },
  "mp4-to-mp3": {
    title: "MP4 to MP3",
    category: "convert",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["video/mp4"],
    output: "audio/mpeg"
  },
  "merge-pdfs": {
    title: "Merge PDFs",
    category: "merge",
    minFiles: 2,
    maxFiles: 40,
    accepts: ["application/pdf"],
    output: "application/pdf"
  },
  "images-to-pdf": {
    title: "Merge Images into PDF",
    category: "merge",
    minFiles: 1,
    maxFiles: 40,
    accepts: ["image/jpeg", "image/png", "image/webp"],
    output: "application/pdf"
  },
  "merge-images": {
    title: "Image Merge",
    category: "merge",
    minFiles: 2,
    maxFiles: 40,
    accepts: ["image/jpeg", "image/png", "image/webp"],
    output: "image/png"
  },
  "merge-audio": {
    title: "Audio Merge",
    category: "merge",
    minFiles: 2,
    maxFiles: 20,
    accepts: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/aac", "audio/mp4", "audio/ogg"],
    output: "audio/mpeg"
  },
  "merge-video": {
    title: "Video Merge",
    category: "merge",
    minFiles: 2,
    maxFiles: 12,
    accepts: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
    output: "video/mp4"
  },
  "merge-excel": {
    title: "Excel Merge",
    category: "merge",
    minFiles: 2,
    maxFiles: 20,
    accepts: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    extensions: [".xlsx"],
    output: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  },
  "merge-word": {
    title: "Word Merge",
    category: "merge",
    minFiles: 2,
    maxFiles: 20,
    accepts: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    extensions: [".docx"],
    output: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  },
  "compress-images": {
    title: "Compress Images",
    category: "compress",
    minFiles: 1,
    maxFiles: 20,
    accepts: ["image/jpeg", "image/png", "image/webp"],
    output: "application/zip"
  },
  "compress-pdf": {
    title: "Compress PDF",
    category: "compress",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    output: "application/pdf"
  },
  "split-pdf": {
    title: "Split PDF",
    category: "split",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    output: "application/pdf"
  },
  "lock-pdf": {
    title: "Lock PDF",
    category: "security",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    output: "application/pdf",
    nativeHelper: "qpdf"
  },
  "unlock-pdf": {
    title: "Unlock PDF",
    category: "security",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    output: "application/pdf",
    nativeHelper: "qpdf"
  }
};

export function getTool(toolType) {
  return tools[toolType];
}

export function toolsByCategory(category) {
  return Object.entries(tools)
    .filter(([, tool]) => tool.category === category)
    .map(([id, tool]) => ({ id, ...tool }));
}
