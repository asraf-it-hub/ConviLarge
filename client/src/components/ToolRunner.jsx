import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, downloadUrl } from "../services/api.js";
import { formatBytes } from "../utils/tools.js";
import Button from "./Button.jsx";
import FileDropzone from "./FileDropzone.jsx";

export default function ToolRunner({ tool }) {
  const [files, setFiles] = useState([]);
  const [level, setLevel] = useState("balanced");
  const [pageRange, setPageRange] = useState("1-1");
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState(0);
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  async function submit(event) {
    event.preventDefault();
    if (!files.length) return toast.error("Add at least one file first");
    setBusy(true);
    setProgress(4);
    setJob(null);

    const form = new FormData();
    form.append("toolType", tool.id);
    form.append("level", level);
    form.append("pageRange", pageRange);
    form.append("password", password);
    files.forEach((file) => form.append("files", file));

    try {
      const { data } = await api.post("/tools/run", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.min(92, Math.round((event.loaded / event.total) * 86)));
        }
      });
      setProgress(100);
      setJob(data.job);
      toast.success("Your file is ready");
    } catch (error) {
      toast.error(error.response?.data?.message || "Processing failed");
      setProgress(0);
    } finally {
      setBusy(false);
    }
  }

  const needsLevel = tool.id.includes("compress");
  const needsRange = tool.id === "split-pdf";
  const needsPassword = tool.id === "lock-pdf" || tool.id === "unlock-pdf";

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <FileDropzone files={files} setFiles={setFiles} tool={tool} />
      <aside className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
            <WandSparkles size={20} />
          </span>
          <div>
            <h2 className="font-bold text-slate-950 dark:text-white">{tool.title}</h2>
            <p className="text-sm text-slate-500">{files.length} file(s), {formatBytes(totalSize)}</p>
          </div>
        </div>

        {needsLevel && (
          <label className="mt-5 block text-sm font-semibold">
            Compression level
            <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="low">Light</option>
              <option value="balanced">Balanced</option>
              <option value="high">Smallest file</option>
            </select>
          </label>
        )}

        {needsRange && (
          <label className="mt-5 block text-sm font-semibold">
            Page range
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder="1-3,5" />
          </label>
        )}

        {needsPassword && (
          <label className="mt-5 block text-sm font-semibold">
            PDF password
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          </label>
        )}

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div className="h-full bg-brand-500" animate={{ width: `${progress}%` }} />
        </div>

        <Button className="mt-5 w-full" disabled={busy || !files.length}>
          {busy && <Loader2 className="animate-spin" size={18} />}
          {busy ? "Processing" : "Start"}
        </Button>

        <AnimatePresence>
          {job?.outputFile && (
            <motion.a
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              href={downloadUrl(job.outputFile.downloadUrl)}
              className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 p-3 text-sm font-semibold text-brand-900 ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-50 dark:ring-brand-900"
            >
              <span className="truncate">{job.outputFile.name}</span>
              <Download size={18} />
            </motion.a>
          )}
        </AnimatePresence>
      </aside>
    </form>
  );
}
