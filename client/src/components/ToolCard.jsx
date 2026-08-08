import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

export default function ToolCard({ tool, isSelected }) {
  const Icon = tool.icon;
  return (
    <Link
      to={tool.route}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`group rounded-lg bg-white p-5 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-soft dark:bg-slate-900 ${
        isSelected
          ? "ring-2 ring-brand-500 bg-brand-50/30 dark:bg-brand-950/30 dark:ring-brand-400"
          : "ring-slate-200 dark:ring-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-100">
          <Icon size={22} />
        </span>
        {isSelected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider dark:bg-brand-500">
            <Check size={12} strokeWidth={3} />
            Selected
          </span>
        ) : (
          <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500" size={18} />
        )}
      </div>
      <h3 className="mt-5 text-base font-bold text-slate-950 dark:text-white">{tool.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{tool.description}</p>
    </Link>
  );
}
