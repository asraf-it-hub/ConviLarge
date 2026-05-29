import {
  Archive,
  FileArchive,
  FileImage,
  FileLock2,
  FileOutput,
  FileStack,
  FileText,
  ImageDown,
  Music,
  Scissors,
  ShieldCheck,
  Shrink
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
  }
};

export const toolCatalog = [
  { id: "jpg-to-png", category: "convert", title: "JPG to PNG", icon: FileImage, accept: "image/jpeg", maxFiles: 1 },
  { id: "png-to-jpg", category: "convert", title: "PNG to JPG", icon: FileImage, accept: "image/png", maxFiles: 1 },
  { id: "png-to-webp", category: "convert", title: "PNG to WEBP", icon: ImageDown, accept: "image/png", maxFiles: 1 },
  { id: "webp-to-png", category: "convert", title: "WEBP to PNG", icon: ImageDown, accept: "image/webp", maxFiles: 1 },
  { id: "jpg-to-pdf", category: "convert", title: "JPG to PDF", icon: FileText, accept: "image/jpeg", maxFiles: 20 },
  { id: "pdf-to-jpg", category: "convert", title: "PDF to JPG", icon: FileOutput, accept: "application/pdf", maxFiles: 1 },
  { id: "mp4-to-mp3", category: "convert", title: "MP4 to MP3", icon: Music, accept: "video/mp4", maxFiles: 1 },
  { id: "merge-pdfs", category: "merge", title: "Merge PDFs", icon: FileStack, accept: "application/pdf", maxFiles: 40 },
  { id: "images-to-pdf", category: "merge", title: "Images to PDF", icon: FileArchive, accept: "image/jpeg,image/png,image/webp", maxFiles: 40 },
  { id: "compress-images", category: "compress", title: "Compress Images", icon: Shrink, accept: "image/jpeg,image/png,image/webp", maxFiles: 20 },
  { id: "compress-pdf", category: "compress", title: "Compress PDF", icon: Archive, accept: "application/pdf", maxFiles: 1 },
  { id: "split-pdf", category: "split", title: "Split PDF", icon: Scissors, accept: "application/pdf", maxFiles: 1 },
  { id: "lock-pdf", category: "security", title: "Lock PDF", icon: FileLock2, accept: "application/pdf", maxFiles: 1 },
  { id: "unlock-pdf", category: "security", title: "Unlock PDF", icon: ShieldCheck, accept: "application/pdf", maxFiles: 1 }
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
