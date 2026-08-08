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
      className={`group rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-soft dark:bg-slate-900 active:scale-[0.99] ${
        isSelected
          ? "ring-2 ring-brand-500 bg-brand-50/40 dark:bg-brand-950/40 dark:ring-brand-400"
          : "ring-slate-200 dark:ring-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-100">
          <Icon size={20} className="sm:h-5 sm:w-5" />
        </span>
        {isSelected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider dark:bg-brand-500">
            <Check size={11} strokeWidth={3} />
            Selected
          </span>
        ) : (
          <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500" size={18} />
        )}
      </div>
      <h3 className="mt-3 sm:mt-4 text-base font-bold text-slate-950 dark:text-white leading-snug">{tool.title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-600 dark:text-slate-400 line-clamp-2">{tool.description}</p>
    </Link>
  );
}
