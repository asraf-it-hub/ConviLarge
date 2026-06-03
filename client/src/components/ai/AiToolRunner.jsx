import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle2, Clock, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import { formatBytes } from "../../utils/tools.js";
import Button from "../Button.jsx";
import FileDropzone from "../FileDropzone.jsx";

const stages = {
  idle: { label: "Ready", value: 0 },
  uploading: { label: "Uploading", value: 24 },
  extracting: { label: "Reading file", value: 48 },
  thinking: { label: "Generating", value: 78 },
  ready: { label: "Ready", value: 100 }
};

function friendlyError(error) {
  const message = error.response?.data?.message || error.message || "AI request failed";
  if (message.toLowerCase().includes("not configured")) {
    return "AI is ready in the app, but the server still needs an AI API key.";
  }
  return message;
}

function ValueList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-normal text-slate-500">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm leading-6 dark:bg-slate-950/50">
            {typeof item === "string" ? item : `${item.toolName || item.toolId || "Tool"}: ${item.reason || ""}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AiResult({ task }) {
  const output = task?.output || {};
  if (!task) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
          <CheckCircle2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-950 dark:text-white">AI result ready</p>
          <p className="text-sm text-slate-500">{task.provider} · {task.model}</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {output.summary && <p className="rounded-lg bg-brand-50 p-4 leading-7 text-brand-950 dark:bg-brand-900/30 dark:text-brand-50">{output.summary}</p>}
        {output.answer && <p className="rounded-lg bg-brand-50 p-4 leading-7 text-brand-950 dark:bg-brand-900/30 dark:text-brand-50">{output.answer}</p>}
        {output.text && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-950">{output.text}</pre>}
        {output.headline && <p className="text-lg font-black">{output.headline}</p>}
        {Number.isFinite(output.score) && (
          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/50">
            <p className="text-sm font-bold text-slate-500">Resume score</p>
            <p className="mt-1 text-3xl font-black">{output.score}/100</p>
          </div>
        )}
        {output.recommendedToolName && (
          <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/30">
            <p className="text-sm font-bold text-brand-700 dark:text-brand-100">Recommended tool</p>
            <p className="mt-1 text-xl font-black">{output.recommendedToolName}</p>
            <p className="mt-2 text-sm leading-6">{output.reason}</p>
          </div>
        )}
        <ValueList title="Key points" items={output.keyPoints} />
        <ValueList title="Action items" items={output.actionItems} />
        <ValueList title="Warnings" items={output.risksOrWarnings} />
        <ValueList title="Strengths" items={output.strengths} />
        <ValueList title="Gaps" items={output.gaps} />
        <ValueList title="Improvements" items={output.improvements} />
        <ValueList title="ATS notes" items={output.atsNotes} />
        <ValueList title="Alternatives" items={output.alternatives} />
        {output.suggestedSummary && (
          <div>
            <h3 className="text-sm font-black uppercase tracking-normal text-slate-500">Suggested summary</h3>
            <p className="mt-2 rounded-lg bg-slate-50 p-4 leading-7 dark:bg-slate-950/50">{output.suggestedSummary}</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default function AiToolRunner({ tool }) {
  const [files, setFiles] = useState([]);
  const [provider, setProvider] = useState("");
  const [request, setRequest] = useState("");
  const [length, setLength] = useState("balanced");
  const [targetRole, setTargetRole] = useState("");
  const [question, setQuestion] = useState("");
  const [task, setTask] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const canSubmit = tool.id === "ai-tool-recommendation" ? Boolean(files.length || request.trim()) : Boolean(files.length);

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    setTask(null);
    setFiles([]);
    setStage("idle");
    setProgress(0);
  }, [tool.id]);

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

    const form = new FormData();
    form.append("toolType", tool.id);
    if (provider) form.append("provider", provider);
    form.append("options", JSON.stringify({ request, length, targetRole, question }));
    files.forEach((file) => form.append("files", file));

    setBusy(true);
    setTask(null);
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
      toast.error(friendlyError(error));
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
        <form onSubmit={submit} className="space-y-5">
          <FileDropzone files={files} setFiles={setFiles} tool={tool} />

          <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold">
                Provider
                <select className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={provider} onChange={(event) => setProvider(event.target.value)}>
                  <option value="">Server default</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Gemini</option>
                </select>
              </label>
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
            </div>

            <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-normal text-slate-500">
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
              <Button type="button" variant="soft" onClick={() => { setFiles([]); setTask(null); setProgress(0); setStage("idle"); }}>
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

        <AnimatePresence>{task && <AiResult task={task} />}</AnimatePresence>
      </div>

      <aside className="space-y-5">
        <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/50 dark:text-brand-100">
              <Sparkles size={20} />
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
