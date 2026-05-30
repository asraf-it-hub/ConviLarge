import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryMeta, toolCatalog } from "../utils/tools.js";

const RECENT_TOOLS_KEY = "convilarge_recent_tools";
const popularToolIds = ["merge-pdfs", "split-pdf", "jpg-to-png", "compress-images", "mp4-to-mp3", "compress-pdf"];

function readRecentTools() {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function buildSearchText(tool) {
  return [tool.name, tool.description, categoryMeta[tool.category]?.label, ...(tool.keywords || [])]
    .join(" ")
    .toLowerCase();
}

function Highlight({ text, query }) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return text;

  const index = text.toLowerCase().indexOf(cleanQuery.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-coral/20 px-0.5 text-inherit dark:bg-coral/30">{text.slice(index, index + cleanQuery.length)}</mark>
      {text.slice(index + cleanQuery.length)}
    </>
  );
}

export default function HomeToolSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState(readRecentTools);

  const recentTools = useMemo(
    () => recentIds.map((id) => toolCatalog.find((tool) => tool.id === id)).filter(Boolean).slice(0, 4),
    [recentIds]
  );

  const popularTools = useMemo(
    () => popularToolIds.map((id) => toolCatalog.find((tool) => tool.id === id)).filter(Boolean),
    []
  );

  const searchResults = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    return toolCatalog
      .map((tool) => {
        const searchText = buildSearchText(tool);
        const score = terms.reduce((sum, term) => sum + (searchText.includes(term) ? 1 : 0), 0);
        return { tool, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .map(({ tool }) => tool)
      .slice(0, 8);
  }, [query]);

  const visibleTools = query.trim() ? searchResults : recentTools.length ? recentTools : popularTools;
  const panelTitle = query.trim() ? "Matching tools" : recentTools.length ? "Recently searched" : "Popular tools";
  const showPanel = focused || query.trim();

  function rememberTool(tool) {
    const next = [tool.id, ...recentIds.filter((id) => id !== tool.id)].slice(0, 6);
    setRecentIds(next);
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
  }

  function openTool(tool) {
    rememberTool(tool);
    setFocused(false);
    setQuery("");
    navigate(tool.route);
  }

  function handleKeyDown(event) {
    if (!showPanel) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(visibleTools.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === "Enter" && visibleTools[activeIndex]) {
      event.preventDefault();
      openTool(visibleTools[activeIndex]);
    }

    if (event.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  function updateQuery(value) {
    setQuery(value);
    setActiveIndex(0);
  }

  return (
    <div className="relative mt-8 max-w-2xl">
      <div className="group flex min-h-[4rem] items-center gap-3 rounded-lg bg-white px-4 shadow-soft ring-1 ring-slate-200 transition focus-within:ring-2 focus-within:ring-brand-500 dark:bg-slate-900 dark:ring-slate-800">
        <Search className="shrink-0 text-slate-400 group-focus-within:text-brand-500" size={22} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          onKeyDown={handleKeyDown}
          type="search"
          placeholder="Search tools like pdf merge, jpg to png, mp4 to mp3..."
          className="h-16 min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white sm:text-lg"
          aria-label="Search tools"
          aria-expanded={showPanel}
        />
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-[4.75rem] z-30 overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <span>{panelTitle}</span>
              {!query.trim() && recentTools.length > 0 && <Clock3 size={15} />}
            </div>

            {visibleTools.length ? (
              <div className="max-h-[24rem] overflow-y-auto p-2">
                {visibleTools.map((tool, index) => {
                  const Icon = tool.icon;
                  const active = index === activeIndex;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openTool(tool)}
                      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                        active
                          ? "bg-brand-600 text-white shadow-sm dark:bg-brand-400 dark:text-slate-950"
                          : "text-slate-950 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ${
                        active
                          ? "bg-white/15 text-white ring-white/20 dark:bg-slate-950/10 dark:text-slate-950 dark:ring-slate-950/20"
                          : "bg-white text-brand-600 ring-slate-200 dark:bg-slate-950 dark:text-brand-100 dark:ring-slate-800"
                      }`}
                      >
                        <Icon size={21} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-bold ${active ? "text-white dark:text-slate-950" : "text-slate-950 dark:text-white"}`}>
                          <Highlight text={tool.name} query={query} />
                        </span>
                        <span className={`mt-0.5 block truncate text-sm ${active ? "text-white/85 dark:text-slate-800" : "text-slate-500 dark:text-slate-400"}`}>
                          <Highlight text={tool.description} query={query} />
                        </span>
                      </span>
                      <span className={`hidden rounded-full px-2 py-1 text-xs font-bold sm:inline-flex ${
                        active
                          ? "bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                      >
                        {categoryMeta[tool.category]?.label}
                      </span>
                      <ArrowRight size={17} className={`shrink-0 ${active ? "text-white dark:text-slate-950" : "text-slate-300"}`} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="font-bold text-slate-950 dark:text-white">No tools found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a format or action, like PDF, merge, compress, or MP3.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
