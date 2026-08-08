import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Award, BookOpen, Bot, Briefcase, CheckCircle2, Clock, Code2, Download, Eye, FileCheck2, FileText, GraduationCap, HelpCircle, Lightbulb, Loader2, LogIn, RefreshCw, ShieldAlert, Sparkles, Star, Tag, Trash2, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { formatBytes } from "../../utils/tools.js";
import Button from "../Button.jsx";
import FileDropzone from "../FileDropzone.jsx";

const stages = {
  idle: { label: "Ready", value: 0 },
  uploading: { label: "Uploading", value: 24 },
  extracting: { label: "Reading file", value: 48 },
  thinking: { label: "AI processing", value: 78 },
  ready: { label: "Ready", value: 100 }
};

const languages = ["English", "Hindi", "Telugu", "Tamil", "Urdu", "French", "German", "Spanish", "Arabic", "Chinese", "Japanese"];
const imageToolIds = new Set(["ai-background-remover", "ai-image-upscaler", "ai-image-enhancer"]);

function friendlyError(error) {
  const message = error.response?.data?.message || error.message || "AI request failed";
  if (message.toLowerCase().includes("not configured")) return "AI is ready in the app, but the server still needs an AI API key.";
  return message;
}

function actionLinkClass() {
  return "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200";
}

function HighlightText({ text }) {
  if (!text || typeof text !== "string") return text;

  const pattern = /(CGPA[\s:]*\d+\.?\d*|\b\d+\.?\d*\s*\/\s*10\b|\b\d+%\b|\b\d+k\+\b|\b\d+\+\b|MERN stack|MERN|Flutter|React|Node\.js|Express|MongoDB|TypeScript|JavaScript|Python|Docker|AWS|REST APIs?|DSA|OOP|DBMS|LeetCode|GitHub|Certification|Certified|Awarded|First place|Rank \d+|Top \d+%?)/gi;

  const parts = text.split(pattern);

  return (
    <span>
      {parts.map((part, index) => {
        if (!part) return null;
        const lower = part.toLowerCase();

        // Achievements & CGPA
        if (lower.includes("cgpa") || lower.match(/\d+\.?\d*\s*\/\s*10/) || lower.includes("awarded") || lower.includes("rank") || lower.includes("first place")) {
          return (
            <span key={index} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-extrabold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 mx-0.5 shadow-2xs">
              <Trophy size={12} className="shrink-0 text-emerald-500" />
              {part}
            </span>
          );
        }

        // Projects & Tech Stacks
        if (["mern stack", "mern", "flutter", "react", "node.js", "express", "mongodb", "typescript", "javascript", "python", "docker", "aws", "rest api", "rest apis", "dsa", "oop", "dbms", "leetcode", "github"].includes(lower)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 rounded-md border border-brand-500/30 bg-brand-500/10 px-1.5 py-0.5 text-xs font-extrabold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300 mx-0.5 shadow-2xs">
              <Code2 size={12} className="shrink-0 text-brand-500" />
              {part}
            </span>
          );
        }

        // Metrics & Results
        if (lower.match(/\d+%/) || lower.match(/\d+k\+/) || lower.match(/\d+\+/)) {
          return (
            <span key={index} className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-xs font-extrabold text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 mx-0.5 shadow-2xs">
              <Zap size={12} className="shrink-0 text-cyan-500" />
              {part}
            </span>
          );
        }

        // Certifications
        if (lower.includes("certification") || lower.includes("certified")) {
          return (
            <span key={index} className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs font-extrabold text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 mx-0.5 shadow-2xs">
              <Award size={12} className="shrink-0 text-amber-500" />
              {part}
            </span>
          );
        }

        return part;
      })}
    </span>
  );
}

function ValueList({ title, items, icon: Icon }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-brand-500 shrink-0" />}
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const rawText = typeof item === "string" ? item : `${item.toolName || item.toolId || "Item"}: ${item.reason || item.answer || ""}`;
          return (
            <li key={`${title}-${index}`} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-sm leading-6 dark:border-slate-800 dark:bg-slate-950/50 shadow-2xs">
              <HighlightText text={rawText} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ComparisonPreview({ beforeUrl, afterUrl, label = "Preview" }) {
  const [position, setPosition] = useState(50);
  if (!beforeUrl) return null;
  return (
    <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black">{label}</h3>
        <span className="text-xs font-bold uppercase text-slate-500">{afterUrl ? "Before / after" : "Original"}</span>
      </div>
      <div className="relative mt-4 aspect-video overflow-hidden rounded-lg bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:22px_22px] bg-[position:0_0,0_11px,11px_-11px,-11px_0] dark:bg-slate-950">
        <img src={beforeUrl} alt="Original preview" className="h-full w-full object-contain" />
        {afterUrl && (
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
            <img src={afterUrl} alt="Processed preview" className="h-full w-full object-contain" style={{ width: `${10000 / Math.max(position, 1)}%`, maxWidth: "none" }} />
          </div>
        )}
        {afterUrl && <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-100">After</div>}
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-100">Before</div>
      </div>
      {afterUrl && (
        <input
          type="range"
          min="5"
          max="95"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="mt-4 w-full accent-brand-500"
          aria-label="Before and after comparison"
        />
      )}
    </section>
  );
}

function QuizMode({ questions = [] }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = questions.reduce((sum, item) => {
    const chosen = String(answers[item.id] || "").trim().toLowerCase();
    const correct = String(item.answer || "").trim().toLowerCase();
    return sum + (chosen && chosen === correct ? 1 : 0);
  }, 0);

  if (!questions.length) return null;

  return (
    <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-black">Interactive quiz</h3>
        {submitted && <span className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-black text-brand-700 dark:bg-brand-900/30 dark:text-brand-100">Score {score}/{questions.length}</span>}
      </div>
      <div className="mt-4 space-y-4">
        {questions.map((item) => (
          <div key={item.id} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50">
            <p className="text-sm font-black text-slate-500">{item.type?.replace("_", " ")}</p>
            <p className="mt-1 font-semibold">{item.id}. {item.question}</p>
            {item.options?.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.options.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <input type="radio" name={`q-${item.id}`} value={option} checked={answers[item.id] === option} onChange={() => setAnswers((current) => ({ ...current, [item.id]: option }))} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input className="focus-ring mt-3 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900" value={answers[item.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} />
            )}
            {submitted && (
              <div className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 dark:bg-slate-900">
                <p className="font-bold">Answer: {item.answer}</p>
                {item.explanation && <p className="mt-1 text-slate-600 dark:text-slate-400">{item.explanation}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={() => setSubmitted(true)}>Submit quiz</Button>
        <Button type="button" variant="soft" onClick={() => { setAnswers({}); setSubmitted(false); }}>Reset</Button>
      </div>
    </section>
  );
}

function AiResult({ task, beforeUrl }) {
  const output = task?.output || {};
  const [previewDownloadUrl, setPreviewDownloadUrl] = useState(null);
  const canDownload = Boolean(task.downloadUrl);
  const canPreviewImage = previewDownloadUrl && output.previewType === "image" && !output.downloadName?.endsWith(".zip");

  useEffect(() => {
    let url = null;
    let cancelled = false;

    async function loadPreview() {
      if (!task?.downloadUrl || output.previewType !== "image" || output.downloadName?.endsWith(".zip")) {
        setPreviewDownloadUrl(null);
        return;
      }

      const { data } = await api.get(task.downloadUrl, { responseType: "blob" });
      if (cancelled) return;
      url = window.URL.createObjectURL(data);
      setPreviewDownloadUrl(url);
    }

    loadPreview().catch(() => setPreviewDownloadUrl(null));

    return () => {
      cancelled = true;
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [task?.downloadUrl, output.previewType, output.downloadName]);

  if (!task) return null;

  async function downloadOutput() {
    if (!task.downloadUrl) return;
    try {
      const { data } = await api.get(task.downloadUrl, { responseType: "blob" });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = output.downloadName || "convilarge-ai-output";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(friendlyError(error));
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
              <CheckCircle2 size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-950 dark:text-white">AI result ready</p>
              <p className="text-sm text-slate-500">{task.provider} · {task.model}</p>
            </div>
          </div>
          {canDownload && (
            <button type="button" className={actionLinkClass()} onClick={downloadOutput}>
              <Download size={18} />
              Download
            </button>
          )}
        </div>

        <div className="mt-5 space-y-5">
          {output.summary && <p className="rounded-lg bg-brand-50 p-4 leading-7 text-brand-950 dark:bg-brand-900/30 dark:text-brand-50">{output.summary}</p>}
          {output.answer && <p className="rounded-lg bg-brand-50 p-4 leading-7 text-brand-950 dark:bg-brand-900/30 dark:text-brand-50">{output.answer}</p>}
          {output.text && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-950">{output.text}</pre>}
          {output.translatedText && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-950">{output.translatedText}</pre>}
          {output.sourceLanguage && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50">
                <p className="text-xs font-bold uppercase text-slate-500">Detected source</p>
                <p className="mt-1 text-xl font-black">{output.sourceLanguage}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50">
                <p className="text-xs font-bold uppercase text-slate-500">Target language</p>
                <p className="mt-1 text-xl font-black">{output.targetLanguage}</p>
              </div>
            </div>
          )}
          {output.previewOriginal && output.previewTranslated && (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50"><p className="text-sm font-black">Original preview</p><p className="mt-2 text-sm leading-6">{output.previewOriginal}</p></div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50"><p className="text-sm font-black">Translated preview</p><p className="mt-2 text-sm leading-6">{output.previewTranslated}</p></div>
            </div>
          )}
          {Number.isFinite(output.score) && (() => {
            const normalizedScore = output.score <= 10 ? Math.round(output.score * 10) : Math.min(100, Math.max(0, Math.round(output.score)));
            const isHigh = normalizedScore >= 80;
            const isMedium = normalizedScore >= 60 && normalizedScore < 80;

            return (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Resume Rating</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Evaluated on technical depth, impact, academic record, and ATS formatting</p>
                </div>
                <div className={`shrink-0 rounded-xl px-4 py-2 text-center font-mono text-2xl font-black shadow-sm ${
                  isHigh
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                    : isMedium
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/30"
                }`}>
                  {normalizedScore}<span className="text-sm font-bold opacity-75">/100</span>
                </div>
              </div>
            );
          })()}
          {output.recommendedToolName && <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/30"><p className="text-sm font-bold text-brand-700 dark:text-brand-100">Recommended tool</p><p className="mt-1 text-xl font-black">{output.recommendedToolName}</p><p className="mt-2 text-sm leading-6">{output.reason}</p></div>}
          
          {output.keywords?.length > 0 && (
            <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-4 dark:border-brand-900/40 dark:bg-brand-950/30">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                <Tag size={15} />
                <span>Key Tech Skills & Keywords Found</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {output.keywords.map((keyword, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-brand-300/60 bg-white px-3 py-1 text-xs font-bold text-brand-800 shadow-2xs dark:border-brand-700/60 dark:bg-slate-900 dark:text-brand-200">
                    <Sparkles size={12} className="text-brand-500" />
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {output.suggestedSummary && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Sparkles size={15} />
                <span>Suggested Summary Rewrite</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium italic">
                "{output.suggestedSummary}"
              </p>
            </div>
          )}

          <ValueList title="Key points" items={output.keyPoints} icon={FileText} />
          <ValueList title="Action items" items={output.actionItems} icon={Zap} />
          <ValueList title="Warnings" items={output.risksOrWarnings} icon={AlertTriangle} />
          <ValueList title="Strengths" items={output.strengths} icon={CheckCircle2} />
          <ValueList title="Gaps & Areas to Address" items={output.gaps} icon={ShieldAlert} />
          <ValueList title="Recommended Improvements" items={output.improvements} icon={Lightbulb} />
          <ValueList title="ATS Compliance Notes" items={output.atsNotes} icon={FileCheck2} />
          <ValueList title="Alternatives" items={output.alternatives} icon={HelpCircle} />
          <ValueList title="Notes & Tips" items={output.notes || output.studyTips} icon={BookOpen} />
        </div>
      </section>

      {canPreviewImage && <ComparisonPreview beforeUrl={beforeUrl} afterUrl={previewDownloadUrl} label="Before and after" />}
      <QuizMode questions={output.questions} />
    </motion.section>
  );
}

function ToolOptions({ tool, options, setOptions, backgroundFile, setBackgroundFile }) {
  const update = (key, value) => setOptions((current) => ({ ...current, [key]: value }));

  if (tool.id === "ai-document-translator") {
    return (
      <>
        <label className="block text-sm font-semibold">
          Target language
          <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={options.targetLanguage} onChange={(event) => update("targetLanguage", event.target.value)}>
            {languages.map((language) => <option key={language} value={language}>{language}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Selected pages
          <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={options.pageRange} onChange={(event) => update("pageRange", event.target.value)} placeholder="All pages or 1-3, 7" />
        </label>
      </>
    );
  }

  if (tool.id === "ai-background-remover") {
    return (
      <>
        <label className="block text-sm font-semibold">
          Background
          <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={options.backgroundMode} onChange={(event) => update("backgroundMode", event.target.value)}>
            <option value="transparent">Transparent PNG</option>
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="solid">Solid color</option>
            <option value="custom">Uploaded image</option>
          </select>
        </label>
        {options.backgroundMode === "solid" && (
          <label className="block text-sm font-semibold">
            Color
            <input type="color" className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950" value={options.backgroundColor} onChange={(event) => update("backgroundColor", event.target.value)} />
          </label>
        )}
        {options.backgroundMode === "custom" && (
          <label className="block text-sm font-semibold md:col-span-2">
            Background image
            <input type="file" accept="image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" onChange={(event) => setBackgroundFile(event.target.files?.[0] || null)} />
            {backgroundFile && <span className="mt-2 block text-xs text-slate-500">{backgroundFile.name}</span>}
          </label>
        )}
      </>
    );
  }

  if (tool.id === "ai-image-upscaler") {
    return (
      <label className="block text-sm font-semibold">
        Upscale
        <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={options.scale} onChange={(event) => update("scale", event.target.value)}>
          <option value="2">2x</option>
          <option value="4">4x</option>
          <option value="8">8x</option>
        </select>
      </label>
    );
  }

  if (tool.id === "ai-image-enhancer") {
    return (
      <>
        <label className="block text-sm font-semibold md:col-span-2">
          Enhancement strength
          <input type="range" min="0" max="100" value={options.strength} onChange={(event) => update("strength", event.target.value)} className="mt-3 w-full accent-brand-500" />
        </label>
        {["Sharpen", "Noise reduction", "Brightness correction", "Contrast improvement", "Color enhancement", "Face enhancement", "Old photo restoration"].map((label) => (
          <label key={label} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold dark:bg-slate-950/50">
            <input type="checkbox" checked={options.enhancements.includes(label)} onChange={(event) => update("enhancements", event.target.checked ? [...options.enhancements, label] : options.enhancements.filter((item) => item !== label))} />
            {label}
          </label>
        ))}
      </>
    );
  }

  if (tool.id === "ai-pdf-quiz-generator") {
    return (
      <>
        <label className="block text-sm font-semibold">
          Difficulty
          <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={options.difficulty} onChange={(event) => update("difficulty", event.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Questions
          <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={options.questionCount} onChange={(event) => update("questionCount", event.target.value)}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </>
    );
  }

  return null;
}

function initialOptions() {
  return {
    targetLanguage: "English",
    pageRange: "",
    backgroundMode: "transparent",
    backgroundColor: "#ffffff",
    scale: "2",
    strength: "55",
    enhancements: ["Sharpen", "Noise reduction", "Brightness correction", "Contrast improvement", "Color enhancement"],
    difficulty: "medium",
    questionCount: "10"
  };
}

export default function AiToolRunner({ tool }) {
  const [files, setFiles] = useState([]);
  const [provider, setProvider] = useState("");
  const [request, setRequest] = useState("");
  const [length, setLength] = useState("balanced");
  const [targetRole, setTargetRole] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(initialOptions);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [task, setTask] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [limitNotice, setLimitNotice] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const canSubmit = tool.id === "ai-tool-recommendation" ? Boolean(files.length || request.trim()) : Boolean(files.length);
  const loginPath = `/auth?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
  const firstPreview = previewUrls[0]?.url;

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    setTask(null);
    setFiles([]);
    setBackgroundFile(null);
    setLimitNotice(null);
    setOptions(initialOptions());
    setStage("idle");
    setProgress(0);
  }, [tool.id]);

  useEffect(() => {
    const urls = files.filter((file) => file.type.startsWith("image/")).map((file) => ({ name: file.name, url: window.URL.createObjectURL(file) }));
    setPreviewUrls(urls);
    return () => urls.forEach((item) => window.URL.revokeObjectURL(item.url));
  }, [files]);

  async function refreshStats() {
    const [{ data: usageData }, { data: historyData }] = await Promise.all([
      api.get("/ai/usage").catch(() => ({ data: { usage: null } })),
      api.get("/ai/history").catch(() => ({ data: { tasks: [] } }))
    ]);
    setUsage(usageData.usage);
    setHistory(historyData.tasks || []);
  }

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit) return toast.error(tool.id === "ai-tool-recommendation" ? "Describe your goal or add a file first" : "Add a file first");
    if (tool.id === "ai-background-remover" && options.backgroundMode === "custom" && !backgroundFile) return toast.error("Add a background image first");

    const form = new FormData();
    form.append("toolType", tool.id);
    if (provider && !imageToolIds.has(tool.id)) form.append("provider", provider);
    form.append("options", JSON.stringify({
      ...options,
      request,
      length,
      targetRole,
      question,
      sharpen: String(options.enhancements.includes("Sharpen")),
      noiseReduction: String(options.enhancements.includes("Noise reduction")),
      restore: String(options.enhancements.includes("Old photo restoration") || options.enhancements.includes("Face enhancement"))
    }));
    files.forEach((file) => form.append("files", file));
    if (backgroundFile) form.append("files", backgroundFile);

    setBusy(true);
    setTask(null);
    setLimitNotice(null);
    setStage("uploading");
    setProgress(stages.uploading.value);

    try {
      const { data } = await api.post("/ai/run", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const uploaded = Math.round((event.loaded / event.total) * 100);
          setStage(uploaded >= 100 ? "extracting" : "uploading");
          setProgress(Math.min(stages.extracting.value, 12 + Math.round(uploaded * 0.36)));
        }
      });
      setStage("thinking");
      setProgress(stages.thinking.value);
      setTask(data.task);
      setStage("ready");
      setProgress(100);
      toast.success("AI result ready");
      refreshStats();
    } catch (error) {
      const response = error.response?.data;
      if (error.response?.status === 429 && response?.code === "AI_GUEST_LIMIT_REACHED") {
        setLimitNotice(response);
        toast.error("Please sign in to continue using AI tools");
      } else {
        toast.error(friendlyError(error));
      }
      setStage("idle");
      setProgress(0);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    if (!task?.id) return;
    await api.delete(`/ai/tasks/${task.id}`);
    setTask(null);
    setStage("idle");
    setProgress(0);
    refreshStats();
    toast.success("AI task deleted");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-6">
      <div className="space-y-5">
        {limitNotice && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white p-5 ring-1 ring-brand-200 dark:bg-slate-900 dark:ring-brand-900/60"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
                  <LogIn size={21} />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">Sign in to continue</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {limitNotice.message} Login is optional until you choose it, and this tool will reopen after sign in.
                  </p>
                  <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 sm:grid-cols-3">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-300" />
                      Store AI history
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-300" />
                      Free unlimited AI tools access
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-brand-600 dark:text-brand-300" />
                      Future downloads
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => navigate(loginPath)}
                className="shrink-0"
              >
                <LogIn size={18} />
                Login
              </Button>
            </div>
          </motion.section>
        )}

        {!limitNotice && (
          <>
            <form onSubmit={submit} className="space-y-5">
              <FileDropzone files={files} setFiles={setFiles} tool={tool} />

          {firstPreview && <ComparisonPreview beforeUrl={firstPreview} label="Live preview" />}

          <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
                <Sparkles size={20} />
              </span>
              <div>
                <h2 className="font-black">AI controls</h2>
                <p className="text-sm text-slate-500">Tune the output before processing.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {!imageToolIds.has(tool.id) && (
                <label className="block text-sm font-semibold">
                  Provider
                  <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={provider} onChange={(event) => setProvider(event.target.value)}>
                    <option value="">Server default</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </label>
              )}
              {tool.id === "ai-pdf-summarizer" && (
                <label className="block text-sm font-semibold">
                  Summary length
                  <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={length} onChange={(event) => setLength(event.target.value)}>
                    <option value="short">Short</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </label>
              )}
              {tool.id === "ai-resume-analyzer" && (
                <label className="block text-sm font-semibold md:col-span-2">
                  Target role
                  <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Product manager, frontend developer, data analyst" />
                </label>
              )}
              {tool.id === "chat-with-pdf" && (
                <label className="block text-sm font-semibold md:col-span-2">
                  Question
                  <textarea className="focus-ring mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask something about the PDF" />
                </label>
              )}
              {tool.id === "ai-tool-recommendation" && (
                <label className="block text-sm font-semibold md:col-span-2">
                  What do you want to do?
                  <textarea className="focus-ring mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950" value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Example: I need to make this PDF smaller and add page numbers" />
                </label>
              )}
              <ToolOptions tool={tool} options={options} setOptions={setOptions} backgroundFile={backgroundFile} setBackgroundFile={setBackgroundFile} />
            </div>

            <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase text-slate-500">
              <span>{stages[stage]?.label}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div className="h-full bg-brand-500" animate={{ width: `${progress}%` }} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button disabled={busy || !canSubmit}>
                {busy && <Loader2 className="animate-spin" size={18} />}
                {busy ? "Processing" : "Run AI"}
              </Button>
              <Button type="button" variant="soft" onClick={() => { setFiles([]); setTask(null); setProgress(0); setStage("idle"); setBackgroundFile(null); }}>
                <RefreshCw size={17} />
                New
              </Button>
              {task && (
                <Button type="button" variant="ghost" onClick={deleteTask}>
                  <Trash2 size={17} />
                  Delete
                </Button>
              )}
            </div>
          </section>
            </form>

            <AnimatePresence>{task && <AiResult task={task} beforeUrl={firstPreview} />}</AnimatePresence>
          </>
        )}
      </div>

      <aside className="space-y-5">
        <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
              <Eye size={20} />
            </span>
            <div>
              <h2 className="font-black">{tool.title}</h2>
              <p className="text-sm text-slate-500">{files.length} file(s), {formatBytes(totalSize)}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
              <p className="text-xs font-bold uppercase text-slate-500">Today</p>
              <p className="mt-1 text-2xl font-black">{usage?.todayTasks || 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
              <p className="text-xs font-bold uppercase text-slate-500">Tokens</p>
              <p className="mt-1 text-2xl font-black">{usage?.totals?.totalTokens || 0}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-brand-500" />
            <h2 className="font-black">AI history</h2>
          </div>
          <div className="mt-4 space-y-3">
            {history.length ? history.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
                <p className="truncate text-sm font-bold">{item.toolType}</p>
                <p className="mt-1 text-xs text-slate-500">{item.status} · {item.provider || "default"}</p>
              </div>
            )) : (
              <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-950/50">
                <Bot className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-sm font-semibold text-slate-500">No AI history yet</p>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
