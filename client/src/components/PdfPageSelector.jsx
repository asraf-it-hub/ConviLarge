import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

function selectedToRange(selected) {
  const pages = [...selected].sort((a, b) => a - b);
  const ranges = [];
  let start = pages[0];
  let previous = pages[0];

  for (let index = 1; index <= pages.length; index += 1) {
    const page = pages[index];
    if (page === previous + 1) {
      previous = page;
      continue;
    }
    if (start) ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = page;
    previous = page;
  }

  return ranges.join(",");
}

function parseRange(value, pageCount) {
  const selected = new Set();
  const text = String(value || "").trim();
  if (!text) return selected;

  for (const part of text.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const [startRaw, endRaw] = token.split("-");
    const start = Number(startRaw);
    const end = Number(endRaw || startRaw);
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    for (let page = Math.max(1, start); page <= Math.min(pageCount, end); page += 1) selected.add(page);
  }

  return selected;
}

export default function PdfPageSelector({ file, value, onChange, label = "Pages", optional = false }) {
  const [pages, setPages] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const selected = useMemo(() => parseRange(value, pageCount), [value, pageCount]);

  useEffect(() => {
    let cancelled = false;

    async function renderPreview() {
      setPages([]);
      setPageCount(0);
      setError("");
      if (!file || file.type !== "application/pdf") return;

      setStatus("loading");
      try {
        const data = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);

        const previews = [];
        const maxPreviewPages = Math.min(pdf.numPages, 24);
        for (let pageNumber = 1; pageNumber <= maxPreviewPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 0.26 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvasContext: context, viewport }).promise;
          previews.push({ pageNumber, url: canvas.toDataURL("image/jpeg", 0.82) });
          if (cancelled) return;
        }
        setPages(previews);
        setStatus("ready");
      } catch {
        setError("Preview is unavailable for this PDF. You can still type page numbers.");
        setStatus("error");
      }
    }

    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [file]);

  function togglePage(pageNumber) {
    const next = new Set(selected);
    if (next.has(pageNumber)) next.delete(pageNumber);
    else next.add(pageNumber);
    onChange(selectedToRange(next));
  }

  function selectAll() {
    onChange(pageCount ? `1-${pageCount}` : "");
  }

  function clearSelection() {
    onChange("");
  }

  if (!file || file.type !== "application/pdf") return null;

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs text-slate-500">{optional ? "Leave empty for all pages" : "Select pages or type a range"}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="focus-ring h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
            All
          </button>
          <button type="button" onClick={clearSelection} className="focus-ring h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
            Clear
          </button>
        </div>
      </div>

      <input
        className="focus-ring mt-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={optional ? "All pages or 1-3,5" : "1-3,5"}
      />

      {status === "loading" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <FileText size={16} />
          Rendering PDF preview
        </div>
      )}

      {error && <p className="mt-3 text-sm text-coral">{error}</p>}

      {pages.length > 0 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 sm:grid sm:max-h-80 sm:grid-cols-3 sm:overflow-y-auto sm:overflow-x-hidden">
          {pages.map((page) => {
            const isSelected = selected.has(page.pageNumber);
            return (
              <button
                key={page.pageNumber}
                type="button"
                onClick={() => togglePage(page.pageNumber)}
                className={`focus-ring w-24 shrink-0 rounded-lg border bg-white p-1 text-left transition sm:w-auto ${
                  isSelected ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200 hover:border-brand-200 dark:border-slate-700"
                } dark:bg-slate-900`}
              >
                <img src={page.url} alt={`Page ${page.pageNumber}`} className="aspect-[3/4] w-full rounded-md object-cover" />
                <span className="mt-1 block text-center text-xs font-bold">Page {page.pageNumber}</span>
              </button>
            );
          })}
        </div>
      )}

      {pageCount > pages.length && (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <ChevronLeft size={13} />
          Showing first {pages.length} of {pageCount} pages
          <ChevronRight size={13} />
        </p>
      )}
    </div>
  );
}
