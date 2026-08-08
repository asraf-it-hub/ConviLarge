import { useMemo, useEffect, useRef } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import ToolCard from "../components/ToolCard.jsx";
import ToolRunner from "../components/ToolRunner.jsx";
import AiToolRunner from "../components/ai/AiToolRunner.jsx";
import { categoryMeta, toolsFor } from "../utils/tools.js";

export default function ToolCategory() {
  const { category, toolSlug } = useParams();
  const [params] = useSearchParams();
  const meta = categoryMeta[category];
  const tools = useMemo(() => toolsFor(category), [category]);
  const isFirstRender = useRef(true);

  const securitySlugMap = {
    "lock-pdf": "lock-pdf",
    "unlock-pdf": "unlock-pdf",
    "view-metadata": "view-pdf-metadata",
    "remove-metadata": "remove-pdf-metadata"
  };
  const selectedId = toolSlug ? securitySlugMap[toolSlug] || toolSlug : params.get("tool");
  const selected = tools.find((tool) => tool.id === selectedId) || tools[0];

  useEffect(() => {
    if (!selected) return;

    // Smooth scroll to top when tool selection changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Show top-right selection toast when switching tools
    if (!isFirstRender.current) {
      toast.success(`Selected "${selected.title}" tool`, {
        id: "selected-tool-toast",
        position: "top-right",
        icon: "✨",
        duration: 3500
      });
    } else {
      isFirstRender.current = false;
    }
  }, [selected?.id]);

  if (!meta) return <Navigate to="/" replace />;
  if (category === "transfer") return <Navigate to="/transfer" replace />;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-brand-600">{meta.label}</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{meta.title}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">{meta.summary}</p>
        </div>

        {/* Selected Tool Indicator Banner */}
        {selected && (
          <div className="self-start md:self-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-brand-200 dark:bg-slate-900 dark:border-brand-800 shadow-soft ring-1 ring-brand-500/10">
            <CheckCircle2 size={20} className="text-brand-600 dark:text-brand-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Tool Selected</span>
              <span className="font-extrabold text-slate-950 dark:text-white text-sm">{selected.title}</span>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        {category === "ai" ? <AiToolRunner tool={selected} /> : <ToolRunner tool={selected} />}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black">More {meta.label.toLowerCase()} tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} isSelected={tool.id === selected?.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
