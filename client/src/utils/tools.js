import {
  Archive,
  Bot,
  BrainCircuit,
  FileArchive,
  FileImage,
  FileLock2,
  FileOutput,
  FileStack,
  FileText,
  FileType2,
  FileVideo,
  MessageSquareText,
  ImageDown,
  Images,
  ImagePlus,
  Maximize2,
  Music,
  PaintBucket,
  RotateCw,
  Scissors,
  ShieldCheck,
  Shrink,
  Sparkles,
  Table2,
  TextSearch
} from "lucide-react";

export const categoryMeta = {
  convert: {
    label: "Convert",
    title: "Conversion Tools",
    summary: "Move files between polished everyday formats with fast previews and reliable downloads."
  },
  merge: {
    label: "Merge",
    title: "Merge Tools",
    summary: "Combine PDFs and images with ordering controls built for real document work."
  },
  compress: {
    label: "Compress",
    title: "Compression Tools",
    summary: "Reduce file size while keeping useful quality controls and clear before-after feedback."
  },
  split: {
    label: "Split",
    title: "Split Tools",
    summary: "Extract the pages you need from larger PDFs using clean page range controls."
  },
  security: {
    label: "Security",
    title: "Security Tools",
    summary: "Protect or unlock PDFs through a secure temporary processing flow."
  },
  image: {
    label: "Image",
    title: "Image Tools",
    summary: "Resize, crop, compress, convert, and clean up images with practical production-ready controls."
  },
  pdf: {
    label: "PDF",
    title: "PDF Management",
    summary: "Rotate, remove, extract, watermark, and number PDF pages without forcing users to sign in."
  },
  ai: {
    label: "AI Tools",
    title: "AI Tools",
    summary: "Summarize, analyze, extract, and understand files with configurable AI providers."
  }
};

function tool({ id, category, name, description, keywords, ...rest }) {
  return {
    id,
    name,
    title: name,
    description,
    category,
    route: `/${category}?tool=${id}`,
    keywords,
    ...rest
  };
}

export const toolCatalog = [
  tool({ id: "jpg-to-png", category: "convert", name: "JPG to PNG", description: "Convert JPG images into clean PNG files.", keywords: ["jpg", "jpeg", "png", "image", "convert"], icon: FileImage, accept: "image/jpeg", maxFiles: 1 }),
  tool({ id: "png-to-jpg", category: "convert", name: "PNG to JPG", description: "Convert PNG images into shareable JPG files.", keywords: ["png", "jpg", "jpeg", "image", "convert"], icon: FileImage, accept: "image/png", maxFiles: 1 }),
  tool({ id: "png-to-webp", category: "convert", name: "PNG to WEBP", description: "Create compact WEBP images from PNG files.", keywords: ["png", "webp", "image", "convert"], icon: ImageDown, accept: "image/png", maxFiles: 1 }),
  tool({ id: "webp-to-png", category: "convert", name: "WEBP to PNG", description: "Turn WEBP images into PNG files.", keywords: ["webp", "png", "image", "convert"], icon: ImageDown, accept: "image/webp", maxFiles: 1 }),
  tool({ id: "jpg-to-pdf", category: "convert", name: "JPG to PDF", description: "Bundle JPG images into a PDF document.", keywords: ["jpg", "jpeg", "pdf", "image", "convert"], icon: FileText, accept: "image/jpeg", maxFiles: 20 }),
  tool({ id: "pdf-to-jpg", category: "convert", name: "PDF to JPG", description: "Export PDF pages as JPG images.", keywords: ["pdf", "jpg", "jpeg", "image", "convert"], icon: FileOutput, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "mp4-to-mp3", category: "convert", name: "MP4 to MP3", description: "Extract MP3 audio from MP4 video files.", keywords: ["mp4", "mp3", "video", "audio", "convert", "extract"], icon: Music, accept: "video/mp4", maxFiles: 1 }),
  tool({ id: "merge-pdfs", category: "merge", name: "PDF Merge", description: "Combine multiple PDFs into one document.", keywords: ["pdf", "merge", "combine", "join", "pdf merge", "merge pdf"], icon: FileStack, accept: "application/pdf", maxFiles: 40 }),
  tool({ id: "images-to-pdf", category: "merge", name: "Images to PDF", description: "Merge images into a single PDF.", keywords: ["image", "images", "pdf", "jpg", "png", "webp", "merge"], icon: FileArchive, accept: "image/jpeg,image/png,image/webp", maxFiles: 40 }),
  tool({ id: "merge-images", category: "merge", name: "Image Merge", description: "Stack images together into one image.", keywords: ["image", "images", "merge", "combine", "jpg", "png", "webp"], icon: Images, accept: "image/jpeg,image/png,image/webp", maxFiles: 40 }),
  tool({ id: "merge-audio", category: "merge", name: "Audio Merge", description: "Join audio files into a single track.", keywords: ["audio", "mp3", "wav", "merge", "combine", "join"], icon: Music, accept: "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/aac,audio/mp4,audio/ogg", maxFiles: 20 }),
  tool({ id: "merge-video", category: "merge", name: "Video Merge", description: "Combine videos into one MP4 file.", keywords: ["video", "mp4", "merge", "combine", "join"], icon: FileVideo, accept: "video/mp4,video/quicktime,video/x-msvideo,video/webm", maxFiles: 12 }),
  tool({ id: "merge-excel", category: "merge", name: "Excel Merge", description: "Merge Excel workbooks into one file.", keywords: ["excel", "xlsx", "spreadsheet", "merge", "combine"], icon: Table2, accept: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", maxFiles: 20 }),
  tool({ id: "merge-word", category: "merge", name: "Word Merge", description: "Merge Word documents into one DOCX.", keywords: ["word", "docx", "document", "merge", "combine"], icon: FileType2, accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", maxFiles: 20 }),
  tool({ id: "compress-images", category: "compress", name: "Image Compress", description: "Reduce image sizes with useful quality controls.", keywords: ["image", "images", "compress", "jpg", "png", "webp", "optimize", "image compress"], icon: Shrink, accept: "image/jpeg,image/png,image/webp", maxFiles: 20 }),
  tool({ id: "compress-pdf", category: "compress", name: "PDF Compress", description: "Compress PDFs for easier sharing.", keywords: ["pdf", "compress", "reduce", "optimize", "small"], icon: Archive, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "split-pdf", category: "split", name: "PDF Split", description: "Split or extract pages from a PDF.", keywords: ["pdf", "split", "extract", "pages", "pdf split", "split pdf"], icon: Scissors, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "lock-pdf", category: "security", name: "Lock PDF", description: "Protect PDFs with a password.", keywords: ["pdf", "lock", "password", "protect", "secure", "encrypt"], icon: FileLock2, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "unlock-pdf", category: "security", name: "Unlock PDF", description: "Remove password protection from PDFs you can open.", keywords: ["pdf", "unlock", "password", "decrypt", "security"], icon: ShieldCheck, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "resize-image", category: "image", name: "Resize Image", description: "Resize images to exact dimensions.", keywords: ["image", "resize", "dimensions", "width", "height"], icon: Maximize2, accept: "image/jpeg,image/png,image/webp", maxFiles: 1 }),
  tool({ id: "crop-image", category: "image", name: "Crop Image", description: "Crop images by position and size.", keywords: ["image", "crop", "trim", "jpg", "png", "webp"], icon: Scissors, accept: "image/jpeg,image/png,image/webp", maxFiles: 1 }),
  tool({ id: "heic-to-jpg", category: "image", name: "HEIC to JPG", description: "Convert HEIC photos into JPG images.", keywords: ["heic", "heif", "jpg", "jpeg", "iphone", "image", "convert"], icon: ImagePlus, accept: ".heic,.heif,image/heic,image/heif", maxFiles: 1 }),
  tool({ id: "remove-background", category: "image", name: "Remove Background", description: "Remove an image background and export PNG.", keywords: ["image", "background", "remove", "transparent", "png"], icon: PaintBucket, accept: "image/jpeg,image/png,image/webp", maxFiles: 1 }),
  tool({ id: "rotate-pdf", category: "pdf", name: "Rotate PDF", description: "Rotate selected PDF pages.", keywords: ["pdf", "rotate", "pages", "turn"], icon: RotateCw, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "remove-pdf-pages", category: "pdf", name: "Remove PDF Pages", description: "Delete selected pages from a PDF.", keywords: ["pdf", "remove", "delete", "pages"], icon: Scissors, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "extract-pdf-pages", category: "pdf", name: "Extract PDF Pages", description: "Save selected PDF pages as a new file.", keywords: ["pdf", "extract", "pages", "save", "split"], icon: FileOutput, accept: "application/pdf", maxFiles: 1 }),
  tool({ id: "watermark-pdf", category: "pdf", name: "Add Watermark", description: "Add text or logo watermarks to PDF pages.", keywords: ["pdf", "watermark", "logo", "stamp", "text", "brand"], icon: PaintBucket, accept: "application/pdf,image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg", maxFiles: 2 }),
  tool({ id: "number-pdf-pages", category: "pdf", name: "Add Page Numbers", description: "Add page numbers to a PDF.", keywords: ["pdf", "page numbers", "number", "pagination", "pages"], icon: FileText, accept: "application/pdf", maxFiles: 1 })
  ,
  tool({ id: "ai-pdf-summarizer", category: "ai", name: "AI PDF Summarizer", description: "Turn long PDFs into summaries, key points, and action items.", keywords: ["ai", "pdf", "summary", "summarize", "document"], icon: Sparkles, accept: "application/pdf,.pdf", maxFiles: 1 }),
  tool({ id: "ai-resume-analyzer", category: "ai", name: "AI Resume Analyzer", description: "Review resumes for strengths, gaps, ATS notes, and improvements.", keywords: ["ai", "resume", "cv", "ats", "career"], icon: BrainCircuit, accept: "application/pdf,.pdf,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document", maxFiles: 1 }),
  tool({ id: "ai-ocr", category: "ai", name: "AI OCR", description: "Extract readable text from screenshots and images.", keywords: ["ai", "ocr", "image", "screenshot", "text"], icon: TextSearch, accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", maxFiles: 1 }),
  tool({ id: "ai-tool-recommendation", category: "ai", name: "AI Tool Recommendation", description: "Describe your goal and get the right ConviLarge tool.", keywords: ["ai", "recommend", "tool", "workflow", "file"], icon: Bot, accept: "application/pdf,image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,.pdf,.jpg,.jpeg,.png,.webp,.mp4,.mp3,.docx,.xlsx", maxFiles: 1 }),
  tool({ id: "chat-with-pdf", category: "ai", name: "Chat With PDF", description: "Ask questions about a PDF and get focused answers.", keywords: ["ai", "chat", "pdf", "question", "document"], icon: MessageSquareText, accept: "application/pdf,.pdf", maxFiles: 1 })
];

export function toolsFor(category) {
  return toolCatalog.filter((tool) => tool.category === category);
}

export function findTool(id) {
  return toolCatalog.find((tool) => tool.id === id) || toolCatalog[0];
}

export function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
