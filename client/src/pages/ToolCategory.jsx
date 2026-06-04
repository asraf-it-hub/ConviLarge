import { useMemo } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import ToolCard from "../components/ToolCard.jsx";
import ToolRunner from "../components/ToolRunner.jsx";
import AiToolRunner from "../components/ai/AiToolRunner.jsx";
import { categoryMeta, toolsFor } from "../utils/tools.js";

export default function ToolCategory() {
  const { category } = useParams();
  const { toolSlug } = useParams();
  const [params] = useSearchParams();
  const meta = categoryMeta[category];
  const tools = useMemo(() => toolsFor(category), [category]);
  const securitySlugMap = {
    "lock-pdf": "lock-pdf",
    "unlock-pdf": "unlock-pdf",
    "view-metadata": "view-pdf-metadata",
    "remove-metadata": "remove-pdf-metadata"
  };
  const selectedId = toolSlug ? securitySlugMap[toolSlug] || toolSlug : params.get("tool");
  const selected = tools.find((tool) => tool.id === selectedId) || tools[0];

  if (!meta) return <Navigate to="/" replace />;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-normal text-brand-600">{meta.label}</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{meta.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">{meta.summary}</p>
      </section>

      <section className="mt-8">
        {category === "ai" ? <AiToolRunner tool={selected} /> : <ToolRunner tool={selected} />}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black">More {meta.label.toLowerCase()} tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      </section>
    </main>
  );
}
