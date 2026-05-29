import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ToolCard({ tool }) {
  const Icon = tool.icon;
  return (
    <Link
      to={`/${tool.category}?tool=${tool.id}`}
      className="group rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-soft dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-100">
          <Icon size={22} />
        </span>
        <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500" size={18} />
      </div>
      <h3 className="mt-5 text-base font-bold text-slate-950 dark:text-white">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Drag, process, and download with temporary storage cleanup after 24 hours.</p>
    </Link>
  );
}
