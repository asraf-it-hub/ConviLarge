import { useState, useRef, useEffect, useCallback } from "react";
import { Crop, Check, X, RotateCcw, Maximize2, Sparkles, Grid } from "lucide-react";
import Button from "./Button.jsx";

const PRESETS = [
  { label: "Free", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "9:16", ratio: 9 / 16 },
  { label: "3:2", ratio: 3 / 2 }
];

export default function InteractiveImageCropper({ file, initialCrop, onApply, onClose }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  // Crop box stored as percentage (0-100) relative to image display container
  const [cropBox, setCropBox] = useState({ left: 10, top: 10, width: 80, height: 80 });
  const [selectedPreset, setSelectedPreset] = useState("Free");
  const [showGrid, setShowGrid] = useState(true);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const boxStartRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const activeHandleRef = useRef(null);

  // Load image object URL
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Handle image load to extract natural dimensions
  function handleImageLoad(e) {
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    setDisplaySize({ width: clientWidth, height: clientHeight });

    // If initialCrop values exist, scale them to percentages
    if (initialCrop?.width && initialCrop?.height && Number(initialCrop.width) > 0) {
      const left = Math.max(0, Math.min(100, (Number(initialCrop.x || 0) / naturalWidth) * 100));
      const top = Math.max(0, Math.min(100, (Number(initialCrop.y || 0) / naturalHeight) * 100));
      const width = Math.max(5, Math.min(100 - left, (Number(initialCrop.width) / naturalWidth) * 100));
      const height = Math.max(5, Math.min(100 - top, (Number(initialCrop.height) / naturalHeight) * 100));
      setCropBox({ left, top, width, height });
    } else {
      // Default 80% centered crop
      setCropBox({ left: 10, top: 10, width: 80, height: 80 });
    }
  }

  // Update display dimensions on window resize
  useEffect(() => {
    function handleResize() {
      if (imageRef.current) {
        setDisplaySize({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight
        });
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apply preset ratio
  function applyPreset(preset) {
    setSelectedPreset(preset.label);
    if (!preset.ratio) return;

    const currentAspect = displaySize.width / displaySize.height;
    let newWidth = cropBox.width;
    let newHeight = (newWidth * displaySize.width) / (preset.ratio * displaySize.height);

    if (newHeight > 90) {
      newHeight = 80;
      newWidth = (newHeight * preset.ratio * displaySize.height) / displaySize.width;
    }

    const left = Math.max(0, Math.min(100 - newWidth, (100 - newWidth) / 2));
    const top = Math.max(0, Math.min(100 - newHeight, (100 - newHeight) / 2));

    setCropBox({ left, top, width: newWidth, height: newHeight });
  }

  // Reset crop box
  function handleReset() {
    setSelectedPreset("Free");
    setCropBox({ left: 5, top: 5, width: 90, height: 90 });
  }

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = useCallback((e, handle = "move") => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    activeHandleRef.current = handle;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = { x: clientX, y: clientY };
    boxStartRef.current = { ...cropBox };
  }, [cropBox]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaYPercent = ((clientY - dragStartRef.current.y) / rect.height) * 100;

    const handle = activeHandleRef.current;
    const start = boxStartRef.current;

    let { left, top, width, height } = start;

    if (handle === "move") {
      left = Math.max(0, Math.min(100 - width, start.left + deltaXPercent));
      top = Math.max(0, Math.min(100 - height, start.top + deltaYPercent));
    } else {
      if (handle.includes("e")) {
        width = Math.max(5, Math.min(100 - start.left, start.width + deltaXPercent));
      }
      if (handle.includes("s")) {
        height = Math.max(5, Math.min(100 - start.top, start.height + deltaYPercent));
      }
      if (handle.includes("w")) {
        const maxDelta = start.width - 5;
        const boundedDelta = Math.min(maxDelta, deltaXPercent);
        left = Math.max(0, start.left + boundedDelta);
        width = start.width - (left - start.left);
      }
      if (handle.includes("n")) {
        const maxDelta = start.height - 5;
        const boundedDelta = Math.min(maxDelta, deltaYPercent);
        top = Math.max(0, start.top + boundedDelta);
        height = start.height - (top - start.top);
      }
    }

    setCropBox({ left, top, width, height });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    activeHandleRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Calculate actual pixel dimensions to submit to backend
  const pixelCrop = {
    x: Math.round((cropBox.left / 100) * naturalSize.width),
    y: Math.round((cropBox.top / 100) * naturalSize.height),
    width: Math.round((cropBox.width / 100) * naturalSize.width),
    height: Math.round((cropBox.height / 100) * naturalSize.height)
  };

  function handleSave() {
    onApply(pixelCrop);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              <Crop size={20} />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base">Interactive Image Cropper</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Drag box or handles to set visual crop area</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Aspect:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition select-none ${
                  selectedPreset === p.label
                    ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950"
                    : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showGrid ? "bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950 dark:border-brand-800 dark:text-brand-300" : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
              }`}
            >
              <Grid size={14} />
              Grid
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* Cropper Canvas Workspace */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950/90 p-6 min-h-[350px]">
          {imageSrc ? (
            <div ref={containerRef} className="relative select-none max-h-[55vh] max-w-full inline-block">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop workspace"
                onLoad={handleImageLoad}
                className="max-h-[55vh] max-w-full object-contain pointer-events-none rounded-lg shadow-xl"
              />

              {/* Darkened overlay outside crop box */}
              <div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                    ${cropBox.left}% ${cropBox.top}%,
                    ${cropBox.left}% ${cropBox.top + cropBox.height}%,
                    ${cropBox.left + cropBox.width}% ${cropBox.top + cropBox.height}%,
                    ${cropBox.left + cropBox.width}% ${cropBox.top}%,
                    ${cropBox.left}% ${cropBox.top}%
                  )`,
                  backgroundColor: "rgba(0, 0, 0, 0.65)"
                }}
              />

              {/* Interactive Crop Box */}
              <div
                onMouseDown={(e) => handlePointerDown(e, "move")}
                onTouchStart={(e) => handlePointerDown(e, "move")}
                className="absolute cursor-move border-2 border-white shadow-2xl ring-1 ring-slate-950/50"
                style={{
                  left: `${cropBox.left}%`,
                  top: `${cropBox.top}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`
                }}
              >
                {/* Rule of Thirds Grid Lines */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>
                )}

                {/* Dimension Badge in Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded bg-slate-950/80 px-2 py-1 text-[11px] font-mono font-bold text-white backdrop-blur-sm opacity-90 shadow-md">
                  {pixelCrop.width} × {pixelCrop.height} px
                </div>

                {/* Resize Handles */}
                {["nw", "ne", "sw", "se", "n", "s", "w", "e"].map((handle) => (
                  <div
                    key={handle}
                    onMouseDown={(e) => handlePointerDown(e, handle)}
                    onTouchStart={(e) => handlePointerDown(e, handle)}
                    className={`absolute h-3.5 w-3.5 rounded-full bg-white border-2 border-brand-600 shadow-md transition-transform hover:scale-125 ${
                      handle === "nw" ? "-left-2 -top-2 cursor-nwse-resize" :
                      handle === "ne" ? "-right-2 -top-2 cursor-nesw-resize" :
                      handle === "sw" ? "-left-2 -bottom-2 cursor-nesw-resize" :
                      handle === "se" ? "-right-2 -bottom-2 cursor-nwse-resize" :
                      handle === "n" ? "left-1/2 -top-2 -translate-x-1/2 cursor-ns-resize" :
                      handle === "s" ? "left-1/2 -bottom-2 -translate-x-1/2 cursor-ns-resize" :
                      handle === "w" ? "-left-2 top-1/2 -translate-y-1/2 cursor-ew-resize" :
                      "right-2 top-1/2 -translate-y-1/2 cursor-ew-resize"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Loading image...</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Original: <strong className="text-slate-900 dark:text-white font-bold">{naturalSize.width} × {naturalSize.height} px</strong>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <Button onClick={handleSave} className="gap-2 text-xs font-bold">
              <Check size={16} />
              Apply Crop ({pixelCrop.width} × {pixelCrop.height})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
