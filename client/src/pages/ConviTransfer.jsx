import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useParams, useSearchParams } from "react-router-dom";
import jsQR from "jsqr";
import {
  CalendarClock,
  CheckCircle2,
  Clipboard,
  Clock,
  Code2,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  Heart,
  KeyRound,
  Link as LinkIcon,
  LockKeyhole,
  QrCode,
  RefreshCw,
  ScanLine,
  Send,
  ShieldCheck,
  Type,
  Trash2,
  UploadCloud,
  XCircle
} from "lucide-react";
import Button from "../components/Button.jsx";
import DashboardStatCard from "../components/DashboardStatCard.jsx";
import { api } from "../services/api.js";
import { formatBytes } from "../utils/tools.js";

const expiryOptions = [
  ["10m", "10 Minutes"],
  ["1h", "1 Hour"],
  ["24h", "24 Hours"],
  ["7d", "7 Days"]
];

const statusStyles = {
  uploaded: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
  viewed: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900",
  downloaded: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-900",
  expired: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900"
};

function friendlyDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function eventTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function filenameFromDisposition(disposition, fallback) {
  const match = /filename="?([^"]+)"?/i.exec(disposition || "");
  return match?.[1] || fallback;
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${statusStyles[status] || statusStyles.uploaded}`}>
      {status}
    </span>
  );
}

function countdownParts(expiresAt) {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (!remaining) return "Transfer Expired";
  if (days) return `${days}d ${hours}h ${minutes}m`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function ExpiryCountdown({ expiresAt, status }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = globalThis.setInterval(() => setTick((value) => value + 1), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);
  const expired = status === "expired" || new Date(expiresAt).getTime() <= Date.now();
  return (
    <div className={`rounded-lg px-4 py-3 ring-1 ${expired ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900" : "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800"}`}>
      <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{expired ? "Transfer Expired" : "Expires in"}</p>
      <p className="mt-1 text-lg font-black">{countdownParts(expiresAt)}</p>
    </div>
  );
}

function looksLikeCode(text = "") {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) return true;
  return /[`{};=<>]|\b(function|const|let|var|import|export|SELECT|ERROR|WARN)\b/.test(trimmed);
}

function deviceLabel(device) {
  return device?.label || "No activity yet";
}

function TransferDropzone({ files, setFiles }) {
  function addFiles(list) {
    const incoming = Array.from(list || []);
    setFiles((current) => [...current, ...incoming].slice(0, 50));
  }

  return (
    <section>
      <motion.label
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
        className="focus-ring flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-500/50 bg-white/85 px-4 py-8 text-center shadow-sm transition hover:border-brand-500 hover:bg-white dark:bg-slate-900/85 dark:hover:bg-slate-900"
      >
        <UploadCloud className="text-brand-500" size={46} />
        <span className="mt-4 text-lg font-black text-slate-950 dark:text-white">Drop files to create a secure transfer</span>
        <span className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
          Upload any file type, mix formats, and share with an access key, QR code, and expiry controls.
        </span>
        <input type="file" multiple className="sr-only" onChange={(event) => addFiles(event.target.files)} />
      </motion.label>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 ring-1 ring-slate-300 dark:bg-slate-950 dark:ring-slate-800">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-brand-600 ring-1 ring-slate-200 dark:bg-brand-900/40 dark:text-brand-100 dark:ring-brand-900/60">
                <FileArchive size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{file.name}</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{formatBytes(file.size)}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remove file">
                <Trash2 size={17} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ConviTransfer() {
  const { transferId } = useParams();
  const [params, setParams] = useSearchParams();
  const initialMode = params.get("mode") === "send" ? "send" : "receive";
  const [mode, setMode] = useState(transferId ? "receive" : initialMode);
  const [files, setFiles] = useState([]);
  const [transferKind, setTransferKind] = useState("file");
  const [expiry, setExpiry] = useState("24h");
  const [password, setPassword] = useState("");
  const [senderName, setSenderName] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [receivePassword, setReceivePassword] = useState("");
  const [oneTimeDownload, setOneTimeDownload] = useState(false);
  const [oneTimeView, setOneTimeView] = useState(false);
  const [accessKey, setAccessKey] = useState(params.get("key") || "");
  const [activeTransferId, setActiveTransferId] = useState(transferId || "");
  const [createdTransfer, setCreatedTransfer] = useState(null);
  const [verifiedTransfer, setVerifiedTransfer] = useState(null);
  const [dashboard, setDashboard] = useState({ stats: null, transfers: [] });
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem("convilarge_transfer_favorites") || "[]"));
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanFrameRef = useRef(0);
  const scannerStreamRef = useRef(null);

  const selectedTransfer = createdTransfer || verifiedTransfer;
  const recentTransfers = dashboard.transfers.slice(0, 3);

  const totalSelectedSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setParams(nextMode === "send" ? { mode: "send" } : { mode: "receive" });
  }

  async function copyText(value, label) {
    await globalThis.navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  function downloadQr() {
    if (!createdTransfer?.qrDataUrl) return;
    const link = document.createElement("a");
    link.href = createdTransfer.qrDataUrl;
    link.download = `${createdTransfer.transferId}-qr.png`;
    link.click();
  }

  async function loadDashboard() {
    setDashboardLoading(true);
    try {
      const { data } = await api.get("/transfers/dashboard");
      setDashboard(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load transfer dashboard");
    } finally {
      setDashboardLoading(false);
    }
  }

  async function createNewTransfer(event) {
    event.preventDefault();
    if (transferKind === "file" && !files.length) {
      toast.error("Add at least one file");
      return;
    }
    if (transferKind === "text" && !textContent.trim()) {
      toast.error("Add text content");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("transferType", transferKind);
    formData.append("senderName", senderName);
    formData.append("messageTitle", messageTitle);
    formData.append("textContent", textContent);
    formData.append("expiry", expiry);
    formData.append("password", password);
    formData.append("oneTimeDownload", String(oneTimeDownload));
    formData.append("oneTimeView", String(oneTimeView));

    try {
      const { data } = await api.post("/transfers", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCreatedTransfer(data.transfer);
      setVerifiedTransfer(null);
      setActiveTransferId(data.transfer.transferId);
      setAccessKey(data.transfer.accessKey);
      setFiles([]);
      setPassword("");
      setMessageTitle("");
      setTextContent("");
      toast.success("Secure transfer generated");
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create transfer");
    } finally {
      setLoading(false);
    }
  }

  async function verifyExistingTransfer(event) {
    event?.preventDefault?.();
    setLoading(true);
    try {
      const endpoint = activeTransferId ? `/transfers/${activeTransferId}/verify` : "/transfers/lookup";
      const { data } = await api.post(endpoint, { accessKey, password: receivePassword });
      setVerifiedTransfer(data.transfer);
      setCreatedTransfer(null);
      setActiveTransferId(data.transfer.transferId);
      toast.success("Transfer unlocked");
      loadDashboard();
    } catch (error) {
      setVerifiedTransfer(null);
      toast.error(error.response?.data?.message || "Could not open transfer");
    } finally {
      setLoading(false);
    }
  }

  async function downloadTransfer() {
    if (!verifiedTransfer) return;
    setLoading(true);
    try {
      const response = await api.post(
        `/transfers/${verifiedTransfer.transferId}/download`,
        { accessKey, password: receivePassword },
        { responseType: "blob" }
      );
      const blobUrl = globalThis.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filenameFromDisposition(response.headers["content-disposition"], verifiedTransfer.files.length === 1 ? verifiedTransfer.files[0].name : `${verifiedTransfer.transferId}.zip`);
      link.click();
      globalThis.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
      globalThis.setTimeout(() => verifyExistingTransfer(), 800);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not download transfer");
    } finally {
      setLoading(false);
    }
  }

  async function copyTransferText(mode) {
    const text = verifiedTransfer?.text?.content || "";
    if (!text) return;
    const allText = [
      verifiedTransfer.title,
      verifiedTransfer.senderName ? `Shared by: ${verifiedTransfer.senderName}` : "",
      text
    ].filter(Boolean).join("\n\n");
    await copyText(mode === "all" ? allText : text, mode === "all" ? "Text details" : "Text");
  }

  function toggleFavorite(transfer) {
    const next = favorites.includes(transfer.transferId)
      ? favorites.filter((id) => id !== transfer.transferId)
      : [...favorites, transfer.transferId];
    setFavorites(next);
    localStorage.setItem("convilarge_transfer_favorites", JSON.stringify(next));
  }

  async function startScanner() {
    setScannerActive(true);
    try {
      const stream = await globalThis.navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      scannerStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const scan = () => {
        if (!scannerStreamRef.current) return;
        const decoded = decodeQrFromVideo();
        if (decoded) {
          applyScannedQr(decoded);
          stopScanner();
          toast.success("QR code scanned");
          return;
        }
        scanFrameRef.current = globalThis.requestAnimationFrame(scan);
      };
      scanFrameRef.current = globalThis.requestAnimationFrame(scan);
    } catch {
      setScannerActive(false);
      toast.error("Camera access was not available");
    }
  }

  function stopScanner() {
    if (scanFrameRef.current) globalThis.cancelAnimationFrame(scanFrameRef.current);
    scanFrameRef.current = 0;
    scannerStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    scannerStreamRef.current = null;
    setScannerActive(false);
  }

  function decodeQrFromVideo() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return "";
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(imageData.data, imageData.width, imageData.height)?.data || "";
  }

  function applyScannedQr(value) {
    const url = new globalThis.URL(value, globalThis.window.location.origin);
    const nextId = url.pathname.split("/").filter(Boolean).pop();
    setActiveTransferId(nextId || "");
    setAccessKey(url.searchParams.get("key") || value);
  }

  function scanQrImage(file) {
    if (!file) return;
    const image = new globalThis.Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height)?.data;
      globalThis.URL.revokeObjectURL(image.src);
      if (!decoded) {
        toast.error("Could not read a QR code from that image");
        return;
      }
      applyScannedQr(decoded);
      toast.success("QR image scanned");
    };
    image.onerror = () => toast.error("Could not open that QR image");
    image.src = globalThis.URL.createObjectURL(file);
  }

  useEffect(() => {
    loadDashboard();
    return () => stopScanner();
  }, []);

  useEffect(() => {
    if (transferId) {
      setMode("receive");
      setActiveTransferId(transferId);
      setAccessKey(params.get("key") || "");
    }
  }, [transferId, params]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-700 ring-1 ring-brand-100 dark:bg-slate-900 dark:text-brand-100 dark:ring-brand-900">
            Secure file sharing for ConviLarge
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-5 text-4xl font-black text-slate-950 dark:text-white sm:text-5xl">
            ConviTransfer
          </motion.h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Send files with an access key, QR code, expiry window, optional password, and one-time download controls.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              [ShieldCheck, "Hashed passwords"],
              [Clock, "Auto expiry"],
              [QrCode, "QR access"],
              [KeyRound, "Rate-limited keys"]
            ].map(([Icon, label]) => (
              <div key={label} className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <Icon className="text-brand-500" size={20} />
                <p className="mt-3 text-sm font-black">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-lg bg-white p-4 shadow-soft ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
            <button onClick={() => switchMode("send")} className={`focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${mode === "send" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}>
              <Send size={17} />
              Send Files
            </button>
            <button onClick={() => switchMode("receive")} className={`focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${mode === "receive" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}>
              <Download size={17} />
              Receive Files
            </button>
          </div>

          {mode === "send" ? (
            <form onSubmit={createNewTransfer} className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                <button type="button" onClick={() => setTransferKind("file")} className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${transferKind === "file" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}>
                  <FileArchive size={16} />
                  File Transfer
                </button>
                <button type="button" onClick={() => setTransferKind("text")} className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition ${transferKind === "text" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}>
                  <Type size={16} />
                  Text Transfer
                </button>
              </div>
              <label className="block">
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">Sender Name</span>
                <input value={senderName} onChange={(event) => setSenderName(event.target.value)} placeholder="Optional" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" />
              </label>
              {transferKind === "file" ? (
                <TransferDropzone files={files} setFiles={setFiles} />
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">Message Title</span>
                    <input value={messageTitle} onChange={(event) => setMessageTitle(event.target.value)} placeholder="Optional title" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">Text Content</span>
                    <textarea
                      value={textContent}
                      onChange={(event) => setTextContent(event.target.value)}
                      required={transferKind === "text"}
                      placeholder="Paste notes, URLs, JSON, logs, or code snippets"
                      className="focus-ring mt-2 min-h-56 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 font-mono text-sm leading-6 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </label>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">Expiry Time</span>
                  <select value={expiry} onChange={(event) => setExpiry(event.target.value)} className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                    {expiryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">Optional Password</span>
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Add password protection" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" />
                </label>
              </div>
              <label className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                <span>
                  <span className="block text-sm font-black">{transferKind === "text" ? "One-Time View" : "One-Time Download"}</span>
                  <span className="mt-1 block text-xs text-slate-500">{transferKind === "text" ? "Delete text after the first successful retrieval." : "Delete files after the first successful download."}</span>
                </span>
                <input
                  type="checkbox"
                  checked={transferKind === "text" ? oneTimeView : oneTimeDownload}
                  onChange={(event) => transferKind === "text" ? setOneTimeView(event.target.checked) : setOneTimeDownload(event.target.checked)}
                  className="h-5 w-5 accent-brand-600"
                />
              </label>
              {transferKind === "file" && files.length > 0 && (
                <p className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-brand-100 ring-1 ring-slate-800 dark:bg-slate-950 dark:text-brand-100 dark:ring-slate-800">
                  {files.length} file{files.length === 1 ? "" : "s"} selected - {formatBytes(totalSelectedSize)}
                </p>
              )}
              {transferKind === "text" && textContent.trim() && (
                <p className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-brand-100 ring-1 ring-slate-800 dark:bg-slate-950 dark:text-brand-100 dark:ring-slate-800">
                  Text selected - {formatBytes(new globalThis.Blob([textContent]).size)}
                </p>
              )}
              <Button type="submit" disabled={loading || (transferKind === "file" ? !files.length : !textContent.trim())} className="w-full">
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                Generate Secure Transfer
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyExistingTransfer} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">Transfer ID</span>
                  <input value={activeTransferId} onChange={(event) => setActiveTransferId(event.target.value.toUpperCase())} placeholder="TRX-7A9K3P" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold uppercase dark:border-slate-800 dark:bg-slate-950" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">Access Key</span>
                  <input value={accessKey} onChange={(event) => setAccessKey(event.target.value.toUpperCase())} placeholder="Q8L2-MX7P" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold uppercase dark:border-slate-800 dark:bg-slate-950" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">Password</span>
                <input value={receivePassword} onChange={(event) => setReceivePassword(event.target.value)} type="password" placeholder="Required only when sender added one" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={loading || !accessKey}>
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <KeyRound size={18} />}
                  Open Transfer
                </Button>
                <Button type="button" variant="soft" onClick={scannerActive ? stopScanner : startScanner}>
                  {scannerActive ? <XCircle size={18} /> : <ScanLine size={18} />}
                  {scannerActive ? "Stop Scan" : "Scan QR"}
                </Button>
                <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/80 px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-800">
                  <QrCode size={18} />
                  Upload QR
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => scanQrImage(event.target.files?.[0])} />
                </label>
              </div>
              {scannerActive && (
                <video ref={videoRef} className="aspect-video w-full rounded-lg bg-slate-950 object-cover" muted playsInline />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </form>
          )}
        </section>
      </section>

      {selectedTransfer && (
        <section className="mt-8 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-brand-600 dark:text-brand-300">Transfer Ready</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{selectedTransfer.transferId}</h2>
              </div>
              <StatusPill status={selectedTransfer.status} />
            </div>

            {createdTransfer && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-black uppercase text-slate-500">Access Key</p>
                  <p className="mt-2 text-xl font-black tracking-normal">{createdTransfer.accessKey}</p>
                </div>
                <ExpiryCountdown expiresAt={createdTransfer.expiresAt} status={createdTransfer.status} />
                {createdTransfer.senderName && (
                  <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs font-black uppercase text-slate-500">Shared by</p>
                    <p className="mt-2 text-sm font-bold">{createdTransfer.senderName}</p>
                  </div>
                )}
              </div>
            )}

            {createdTransfer?.qrDataUrl && (
              <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr]">
                <img src={createdTransfer.qrDataUrl} alt="ConviTransfer QR code" className="h-44 w-44 rounded-lg bg-white p-2 ring-1 ring-slate-200" />
                <div className="grid content-start gap-3">
                  <Button type="button" variant="soft" onClick={() => copyText(createdTransfer.accessKey, "Access key")}>
                    <Copy size={17} />
                    Copy Key
                  </Button>
                  <Button type="button" variant="soft" onClick={() => copyText(createdTransfer.shareUrl, "Share link")}>
                    <LinkIcon size={17} />
                    Copy Link
                  </Button>
                  <Button type="button" variant="soft" onClick={downloadQr}>
                    <QrCode size={17} />
                    Download QR Code
                  </Button>
                </div>
              </div>
            )}

            {verifiedTransfer && (
              <div className="mt-5">
                {verifiedTransfer.transferType === "text" ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                      {verifiedTransfer.title && <h3 className="text-lg font-black">{verifiedTransfer.title}</h3>}
                      {verifiedTransfer.senderName && <p className="mt-1 text-sm font-bold text-brand-600 dark:text-brand-300">Shared by: {verifiedTransfer.senderName}</p>}
                      <p className="mt-3 text-xs text-slate-500">Created {friendlyDate(verifiedTransfer.createdAt)} - Expires {friendlyDate(verifiedTransfer.expiresAt)}</p>
                    </div>
                    <pre className={`max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100 ring-1 ring-slate-800 ${looksLikeCode(verifiedTransfer.text?.content) ? "font-mono" : "font-sans whitespace-pre-wrap"}`}>
                      <code>{verifiedTransfer.text?.content}</code>
                    </pre>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button type="button" variant="soft" onClick={() => copyTransferText("text")}>
                        <Clipboard size={17} />
                        Copy Text
                      </Button>
                      <Button type="button" variant="soft" onClick={() => copyTransferText("all")}>
                        <Copy size={17} />
                        Copy All
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {verifiedTransfer.files.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                          <FileCheck2 className="text-brand-500" size={20} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{file.name}</p>
                            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {verifiedTransfer.senderName && (
                      <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-brand-600 dark:bg-slate-950 dark:text-brand-300">
                        Shared by: {verifiedTransfer.senderName}
                      </p>
                    )}
                    <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950 sm:grid-cols-2">
                      <p><span className="font-black">Uploaded:</span> {friendlyDate(verifiedTransfer.createdAt)}</p>
                      <p><span className="font-black">Expires:</span> {friendlyDate(verifiedTransfer.expiresAt)}</p>
                    </div>
                    <Button type="button" onClick={downloadTransfer} disabled={loading || verifiedTransfer.status === "expired" || new Date(verifiedTransfer.expiresAt).getTime() <= Date.now()} className="mt-4 w-full">
                      {loading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                      Download File{verifiedTransfer.files.length === 1 ? "" : "s"}
                    </Button>
                  </>
                )}
                <div className="mt-4">
                  <ExpiryCountdown expiresAt={verifiedTransfer.expiresAt} status={verifiedTransfer.status} />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-xl font-black">Transfer Status</h2>
            <div className="mt-5 space-y-3">
              {(selectedTransfer.events || []).map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex gap-3">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-100">
                    {item.status === "downloaded" ? <Download size={15} /> : item.status === "viewed" ? <Eye size={15} /> : item.status === "expired" ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                  </span>
                  <div>
                    <p className="font-bold">{eventTime(item.at)} {item.label}</p>
                    <p className="text-xs capitalize text-slate-500">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Secure Transfer Dashboard</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Transfers created from this account or browser session.</p>
          </div>
          <Button type="button" variant="soft" onClick={loadDashboard}>
            <RefreshCw size={17} />
            Refresh
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <DashboardStatCard icon={Send} label="Total Transfers" value={dashboard.stats?.totalTransfers || 0} loading={dashboardLoading} />
          <DashboardStatCard icon={FileArchive} label="Files Shared" value={dashboard.stats?.filesShared || 0} loading={dashboardLoading} />
          <DashboardStatCard icon={Download} label="Downloads" value={dashboard.stats?.downloads || 0} loading={dashboardLoading} />
          <DashboardStatCard icon={CalendarClock} label="Expired Transfers" value={dashboard.stats?.expiredTransfers || 0} loading={dashboardLoading} />
        </div>

        {recentTransfers.length > 0 && (
          <div className="mt-6">
            <h3 className="font-black">Recently shared</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {recentTransfers.map((transfer) => (
                <button key={transfer.transferId} onClick={() => { setMode("receive"); setActiveTransferId(transfer.transferId); }} className="rounded-lg bg-white p-4 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-slate-900 dark:ring-slate-800">
                  <p className="font-black">{transfer.transferType === "text" ? transfer.title || "Text Transfer" : transfer.files[0]?.name || transfer.transferId}</p>
                  <p className="mt-1 text-xs text-slate-500">{transfer.transferType === "text" ? "Text" : `${transfer.files.length} file${transfer.files.length === 1 ? "" : "s"}`} - {friendlyDate(transfer.createdAt)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {dashboardLoading ? (
            <div className="h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ) : dashboard.transfers.length ? (
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              {dashboard.transfers.map((transfer) => (
                <motion.article
                  key={transfer.transferId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950 dark:text-white">
                        {transfer.transferType === "text" ? transfer.title || "Text Transfer" : transfer.files[0]?.name || "Shared files"}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase text-slate-500">{transfer.transferType === "text" ? "Text Transfer" : "File Transfer"}</p>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => toggleFavorite(transfer)} title="Favorite transfer">
                      <Heart size={17} className={favorites.includes(transfer.transferId) ? "fill-coral text-coral" : ""} />
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><p className="text-xs font-black uppercase text-slate-500">Transfer ID</p><p className="mt-1 font-bold">{transfer.transferId}</p></div>
                    <div><p className="text-xs font-black uppercase text-slate-500">Access Key</p><p className="mt-1 font-bold">{transfer.accessKey || "Available for new transfers"}</p></div>
                    <div><p className="text-xs font-black uppercase text-slate-500">Views</p><p className="mt-1 font-bold">{transfer.viewCount || 0}</p></div>
                    <div><p className="text-xs font-black uppercase text-slate-500">Downloads</p><p className="mt-1 font-bold">{transfer.downloadCount || 0}</p></div>
                    <div><p className="text-xs font-black uppercase text-slate-500">Last Viewed</p><p className="mt-1 font-bold">{deviceLabel(transfer.lastViewedDevice)}</p></div>
                    <div><p className="text-xs font-black uppercase text-slate-500">Last Download</p><p className="mt-1 font-bold">{deviceLabel(transfer.lastDownloadedDevice)}</p></div>
                    <div><p className="text-xs font-black uppercase text-slate-500">Created</p><p className="mt-1 font-bold">{friendlyDate(transfer.createdAt)}</p></div>
                    {transfer.senderName && <div><p className="text-xs font-black uppercase text-slate-500">Shared by</p><p className="mt-1 font-bold">{transfer.senderName}</p></div>}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                      {["uploaded", "viewed", "downloaded", "expired"].map((status) => {
                        const item = transfer.events?.find((event) => event.status === status);
                        return (
                          <div key={status} className="flex items-center justify-between gap-3 text-sm">
                            <span className="inline-flex items-center gap-2 font-bold capitalize">
                              <CheckCircle2 size={15} className={item ? "text-brand-500" : "text-slate-300"} />
                              {status}
                            </span>
                            <span className="text-xs text-slate-500">{item ? eventTime(item.at) : "-"}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="min-w-40">
                      <StatusPill status={transfer.status} />
                      <div className="mt-3">
                        <ExpiryCountdown expiresAt={transfer.expiresAt} status={transfer.status} />
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <LockKeyhole className="mx-auto text-brand-500" size={30} />
              <p className="mt-3 font-black">No secure transfers yet</p>
              <p className="mt-2 text-sm text-slate-500">Create a transfer and it will appear here for this account or browser session.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
