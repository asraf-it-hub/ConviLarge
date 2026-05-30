import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CheckCircle2, Download, FileDown, Image, Loader2, RefreshCw, Trash2, Type, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, downloadUrl } from "../services/api.js";
import { formatBytes } from "../utils/tools.js";
import Button from "./Button.jsx";
import FileDropzone from "./FileDropzone.jsx";
import PdfPageSelector from "./PdfPageSelector.jsx";

const watermarkPresets = {
  professional: {
    label: "Professional",
    textColor: "#808080",
    textOpacity: "15",
    textRotation: "45",
    imagePosition: "center",
    imageOpacity: "15",
    imageScale: "25",
    imageRotation: "0"
  },
  confidential: {
    label: "Confidential",
    textColor: "#c94a4a",
    textOpacity: "12",
    textRotation: "45",
    imagePosition: "center",
    imageOpacity: "12",
    imageScale: "32",
    imageRotation: "0"
  },
  brand: {
    label: "Brand Logo",
    textColor: "#808080",
    textOpacity: "10",
    textRotation: "0",
    imagePosition: "bottom-right",
    imageOpacity: "10",
    imageScale: "14",
    imageRotation: "0"
  }
};

const progressStages = {
  idle: { label: "Ready", value: 0 },
  uploading: { label: "Uploading", value: 24 },
  queued: { label: "Queued", value: 42 },
  processing: { label: "Processing", value: 74 },
  saving: { label: "Saving", value: 92 },
  ready: { label: "Ready", value: 100 }
};

function friendlyError(error) {
  const message = error.response?.data?.message || error.message || "Processing failed";
  const lower = message.toLowerCase();
  if (lower.includes("encrypted") || lower.includes("password") || lower.includes("decrypt")) {
    return "This PDF appears to be encrypted. Unlock it first, then try again.";
  }
  if (lower.includes("invalid page range")) {
    return message;
  }
  if (lower.includes("unsupported") || lower.includes("not a supported")) {
    return message;
  }
  return message === "Processing failed" ? "Something went wrong while processing this file. Please check the file and try again." : message;
}

export default function ToolRunner({ tool }) {
  const [files, setFiles] = useState([]);
  const [level, setLevel] = useState("balanced");
  const [pageRange, setPageRange] = useState("");
  const [password, setPassword] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [crop, setCrop] = useState({ x: "0", y: "0", width: "", height: "" });
  const [angle, setAngle] = useState("90");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkPreset, setWatermarkPreset] = useState("professional");
  const [watermarkTextOpacity, setWatermarkTextOpacity] = useState(watermarkPresets.professional.textOpacity);
  const [watermarkTextRotation, setWatermarkTextRotation] = useState(watermarkPresets.professional.textRotation);
  const [watermarkTextColor, setWatermarkTextColor] = useState(watermarkPresets.professional.textColor);
  const [watermarkImagePosition, setWatermarkImagePosition] = useState(watermarkPresets.professional.imagePosition);
  const [watermarkImageOpacity, setWatermarkImageOpacity] = useState(watermarkPresets.professional.imageOpacity);
  const [watermarkImageScale, setWatermarkImageScale] = useState(watermarkPresets.professional.imageScale);
  const [watermarkImageRotation, setWatermarkImageRotation] = useState(watermarkPresets.professional.imageRotation);
  const [watermarkLogoText, setWatermarkLogoText] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("idle");
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const pdfFile = useMemo(() => files.find((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")), [files]);
  const outputSize = job?.outputFile?.size || 0;
  const originalSize = job?.meta?.originalTotalBytes || totalSize;
  const savings = outputSize && originalSize ? Math.round((1 - outputSize / originalSize) * 100) : null;
  const isCompressionTool = tool.id.includes("compress");

  async function submit(event) {
    event.preventDefault();
    if (!files.length) return toast.error("Add at least one file first");
    setBusy(true);
    setStage("uploading");
    setProgress(progressStages.uploading.value);
    setJob(null);

    const form = new FormData();
    form.append("toolType", tool.id);
    form.append("level", level);
    form.append("pageRange", pageRange);
    form.append("password", password);
    form.append("width", width);
    form.append("height", height);
    form.append("keepAspect", String(keepAspect));
    form.append("cropX", crop.x);
    form.append("cropY", crop.y);
    form.append("cropWidth", crop.width);
    form.append("cropHeight", crop.height);
    form.append("angle", angle);
    form.append("watermarkText", watermarkText);
    form.append("watermarkPreset", watermarkPreset);
    form.append("watermarkTextOpacity", watermarkTextOpacity);
    form.append("watermarkTextRotation", watermarkTextRotation);
    form.append("watermarkTextColor", watermarkTextColor);
    form.append("watermarkImagePosition", watermarkImagePosition);
    form.append("watermarkImageOpacity", watermarkImageOpacity);
    form.append("watermarkImageScale", watermarkImageScale);
    form.append("watermarkImageRotation", watermarkImageRotation);
    form.append("watermarkLogoText", watermarkLogoText);
    files.forEach((file) => form.append("files", file));

    try {
      const { data } = await api.post("/tools/run", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const uploaded = Math.round((event.loaded / event.total) * 100);
            setStage(uploaded >= 100 ? "processing" : "uploading");
            setProgress(Math.min(progressStages.processing.value, 12 + Math.round(uploaded * 0.48)));
          }
        }
      });
      setStage("saving");
      setProgress(progressStages.saving.value);
      setProgress(100);
      setStage("ready");
      setJob(data.job);
      toast.success("Your file is ready");
    } catch (error) {
      toast.error(friendlyError(error));
      setProgress(0);
      setStage("idle");
    } finally {
      setBusy(false);
    }
  }

  const needsLevel = tool.id.includes("compress");
  const needsRange = ["split-pdf", "rotate-pdf", "remove-pdf-pages", "extract-pdf-pages"].includes(tool.id);
  const needsPassword = tool.id === "lock-pdf" || tool.id === "unlock-pdf";
  const needsResize = tool.id === "resize-image";
  const needsCrop = tool.id === "crop-image";
  const needsAngle = tool.id === "rotate-pdf";
  const needsWatermark = tool.id === "watermark-pdf";
  const needsPageSelector = ["split-pdf", "rotate-pdf", "remove-pdf-pages", "extract-pdf-pages", "watermark-pdf"].includes(tool.id);

  function applyWatermarkPreset(presetKey) {
    const preset = watermarkPresets[presetKey];
    setWatermarkPreset(presetKey);
    setWatermarkTextColor(preset.textColor);
    setWatermarkTextOpacity(preset.textOpacity);
    setWatermarkTextRotation(preset.textRotation);
    setWatermarkImagePosition(preset.imagePosition);
    setWatermarkImageOpacity(preset.imageOpacity);
    setWatermarkImageScale(preset.imageScale);
    setWatermarkImageRotation(preset.imageRotation);
    if (presetKey === "confidential" && !watermarkText) setWatermarkText("CONFIDENTIAL");
  }

  function resetTool() {
    setJob(null);
    setProgress(0);
    setStage("idle");
    setFiles([]);
  }

  async function deleteOutput() {
    if (!job?.id) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      toast.success("Temporary file deleted");
      setJob(null);
      setProgress(0);
      setStage("idle");
    } catch (error) {
      toast.error(friendlyError(error));
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-6">
      <div className="space-y-5">
        <FileDropzone files={files} setFiles={setFiles} tool={tool} />
        {needsPageSelector && (
          <PdfPageSelector
            file={pdfFile}
            value={pageRange}
            onChange={setPageRange}
            label={tool.id === "watermark-pdf" ? "Watermark pages" : "Page range"}
            optional={tool.id === "rotate-pdf" || tool.id === "watermark-pdf"}
          />
        )}
      </div>
      <aside className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
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

        {needsResize && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Width
              <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="number" min="1" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="1200" />
            </label>
            <label className="block text-sm font-semibold">
              Height
              <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="number" min="1" value={height} onChange={(event) => setHeight(event.target.value)} placeholder="800" />
            </label>
            <label className="col-span-2 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={keepAspect} onChange={(event) => setKeepAspect(event.target.checked)} />
              Keep aspect ratio
            </label>
          </div>
        )}

        {needsCrop && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ["x", "X"],
              ["y", "Y"],
              ["width", "Width"],
              ["height", "Height"]
            ].map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold">
                {label}
                <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="number" min="0" value={crop[key]} onChange={(event) => setCrop({ ...crop, [key]: event.target.value })} />
              </label>
            ))}
          </div>
        )}

        {needsRange && !needsPageSelector && (
          <label className="mt-5 block text-sm font-semibold">
            Page range {tool.id === "rotate-pdf" ? "(optional)" : ""}
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder="1-3,5" />
          </label>
        )}

        {needsAngle && (
          <label className="mt-5 block text-sm font-semibold">
            Rotation
            <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={angle} onChange={(event) => setAngle(event.target.value)}>
              <option value="90">90 degrees</option>
              <option value="180">180 degrees</option>
              <option value="270">270 degrees</option>
            </select>
          </label>
        )}

        {needsWatermark && (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm font-semibold">Preset</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Object.entries(watermarkPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyWatermarkPreset(key)}
                    className={`focus-ring flex h-10 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-bold transition ${
                      watermarkPreset === key
                        ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-50"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    }`}
                  >
                    {watermarkPreset === key && <BadgeCheck size={14} />}
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="relative mx-auto aspect-[3/4] max-w-44 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <div className="absolute inset-x-5 top-6 space-y-2">
                  <div className="h-2 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-4 h-2 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-2 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-2 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                {watermarkText && (
                  <span
                    className="absolute left-1/2 top-1/2 whitespace-nowrap font-sans text-xl font-black uppercase tracking-normal"
                    style={{
                      color: watermarkTextColor,
                      opacity: Number(watermarkTextOpacity || 15) / 100,
                      transform: `translate(-50%, -50%) rotate(${watermarkTextRotation || 45}deg)`
                    }}
                  >
                    {watermarkText}
                  </span>
                )}
                <span
                  className={`absolute grid place-items-center rounded border border-slate-300 bg-white/80 text-slate-400 dark:border-slate-600 dark:bg-slate-800/80 ${
                    watermarkImagePosition === "center"
                      ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      : watermarkImagePosition === "top-left"
                        ? "left-4 top-4"
                        : watermarkImagePosition === "top-right"
                          ? "right-4 top-4"
                          : watermarkImagePosition === "bottom-left"
                            ? "bottom-4 left-4"
                            : "bottom-4 right-4"
                  }`}
                  style={{
                    width: `${Math.max(24, Number(watermarkImageScale || 14) * 2)}px`,
                    height: `${Math.max(16, Number(watermarkImageScale || 14) * 1.2)}px`,
                    opacity: Number(watermarkImageOpacity || 10) / 100,
                    rotate: `${watermarkImageRotation || 0}deg`
                  }}
                  title="Logo preview"
                >
                  <Image size={16} />
                </span>
              </div>
            </div>

            <label className="block text-sm font-semibold">
              Text watermark
              <div className="mt-2 flex gap-2">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                  <Type size={18} />
                </span>
                <input className="focus-ring h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} placeholder="Confidential" />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">
                Text opacity
                <input className="mt-2 w-full accent-brand-500" type="range" min="5" max="100" value={watermarkTextOpacity} onChange={(event) => setWatermarkTextOpacity(event.target.value)} />
                <span className="text-xs font-medium text-slate-500">{watermarkTextOpacity}%</span>
              </label>
              <label className="block text-sm font-semibold">
                Text rotation
                <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="number" min="-90" max="90" value={watermarkTextRotation} onChange={(event) => setWatermarkTextRotation(event.target.value)} />
              </label>
              <label className="col-span-2 block text-sm font-semibold">
                Text color
                <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="color" value={watermarkTextColor} onChange={(event) => setWatermarkTextColor(event.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block text-sm font-semibold">
                Logo position
                <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={watermarkImagePosition} onChange={(event) => setWatermarkImagePosition(event.target.value)}>
                  <option value="center">Center</option>
                  <option value="top-left">Top-left</option>
                  <option value="top-right">Top-right</option>
                  <option value="bottom-left">Bottom-left</option>
                  <option value="bottom-right">Bottom-right</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Logo opacity
                <input className="mt-2 w-full accent-brand-500" type="range" min="5" max="100" value={watermarkImageOpacity} onChange={(event) => setWatermarkImageOpacity(event.target.value)} />
                <span className="text-xs font-medium text-slate-500">{watermarkImageOpacity}%</span>
              </label>
              <label className="block text-sm font-semibold">
                Logo scale
                <input className="mt-2 w-full accent-brand-500" type="range" min="5" max="60" value={watermarkImageScale} onChange={(event) => setWatermarkImageScale(event.target.value)} />
                <span className="text-xs font-medium text-slate-500">{watermarkImageScale}%</span>
              </label>
              <label className="block text-sm font-semibold">
                Logo rotation
                <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="number" min="-180" max="180" value={watermarkImageRotation} onChange={(event) => setWatermarkImageRotation(event.target.value)} />
              </label>
              <label className="block text-sm font-semibold">
                Logo text
                <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={watermarkLogoText} onChange={(event) => setWatermarkLogoText(event.target.value)} placeholder="Optional" />
              </label>
            </div>
          </div>
        )}

        {needsPassword && (
          <label className="mt-5 block text-sm font-semibold">
            PDF password
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          </label>
        )}

        <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-normal text-slate-500">
          <span>{progressStages[stage]?.label || "Ready"}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div className="h-full bg-brand-500" animate={{ width: `${progress}%` }} />
        </div>

        <Button className="mt-5 w-full" disabled={busy || !files.length}>
          {busy && <Loader2 className="animate-spin" size={18} />}
          {busy ? "Processing" : "Start"}
        </Button>

        <AnimatePresence>
          {job?.outputFile && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-lg bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-50 dark:ring-brand-900"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-100" size={19} />
                <div className="min-w-0 flex-1">
                  <p className="font-black">File ready</p>
                  <p className="truncate font-semibold">{job.outputFile.name}</p>
                  <p className="mt-1 text-xs text-brand-800/80 dark:text-brand-50/80">{formatBytes(job.outputFile.size)}</p>
                </div>
              </div>

              {isCompressionTool && outputSize > 0 && originalSize > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white/70 p-2 text-center dark:bg-slate-950/30">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">Before</p>
                    <p className="font-black">{formatBytes(originalSize)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">After</p>
                    <p className="font-black">{formatBytes(outputSize)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">Saved</p>
                    <p className="font-black">{savings > 0 ? `${savings}%` : "0%"}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2">
                <a
                  href={downloadUrl(job.outputFile.downloadUrl)}
                  className="focus-ring col-span-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-bold text-white hover:bg-brand-500 sm:col-span-1"
                >
                  <Download size={17} />
                  Download
                </a>
                <button type="button" onClick={resetTool} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700">
                  <RefreshCw size={15} />
                  New
                </button>
                <button type="button" onClick={deleteOutput} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700">
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-brand-800/75 dark:text-brand-50/75">
                <FileDown size={14} />
                Temporary output is removed automatically after 24 hours.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </form>
  );
}
