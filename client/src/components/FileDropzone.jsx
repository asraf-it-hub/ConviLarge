import { motion } from "framer-motion";
import { ArrowDownUp, GripVertical, Trash2, UploadCloud } from "lucide-react";
import { formatBytes } from "../utils/tools.js";
import Button from "./Button.jsx";

export default function FileDropzone({ files, setFiles, tool }) {
  function addFiles(list) {
    const incoming = Array.from(list || []);
    setFiles((current) => [...current, ...incoming].slice(0, tool.maxFiles));
  }

  function move(index, direction) {
    const next = [...files];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFiles(next);
  }

  function remove(index) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section>
      <motion.label
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className="focus-ring flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-500/50 bg-white/80 px-4 py-8 text-center shadow-sm transition hover:border-brand-500 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900"
      >
        <UploadCloud className="text-brand-500" size={42} />
        <span className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Drop files here</span>
        <span className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
          {tool.title} accepts up to {tool.maxFiles} file{tool.maxFiles > 1 ? "s" : ""}. Files are temporary and automatically cleaned after 24 hours.
        </span>
        <input type="file" accept={tool.accept} multiple={tool.maxFiles > 1} className="sr-only" onChange={(event) => addFiles(event.target.files)} />
      </motion.label>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <GripVertical className="text-slate-400" size={18} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
              {tool.maxFiles > 1 && (
                <Button type="button" variant="ghost" onClick={() => move(index, index === 0 ? 1 : -1)} title="Reorder">
                  <ArrowDownUp size={17} />
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => remove(index)} title="Remove">
                <Trash2 size={17} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
