export const aiTools = {
  "ai-pdf-summarizer": {
    title: "AI PDF Summarizer",
    category: "document",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    extensions: [".pdf"],
    outputMode: "summary"
  },
  "ai-resume-analyzer": {
    title: "AI Resume Analyzer",
    category: "document",
    minFiles: 1,
    maxFiles: 1,
    accepts: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ],
    extensions: [".pdf", ".docx", ".txt"],
    outputMode: "analysis"
  },
  "ai-ocr": {
    title: "AI OCR",
    category: "image",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    outputMode: "text"
  },
  "ai-tool-recommendation": {
    title: "AI Tool Recommendation",
    category: "intelligence",
    minFiles: 0,
    maxFiles: 1,
    accepts: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "audio/mpeg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    extensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mp3", ".docx", ".xlsx"],
    outputMode: "recommendation"
  },
  "chat-with-pdf": {
    title: "Chat With PDF",
    category: "document",
    minFiles: 1,
    maxFiles: 1,
    accepts: ["application/pdf"],
    extensions: [".pdf"],
    outputMode: "chat"
  }
};

export function getAiTool(toolType) {
  return aiTools[toolType];
}

export function listAiTools() {
  return Object.entries(aiTools).map(([id, tool]) => ({ id, ...tool }));
}
