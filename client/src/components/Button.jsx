export default function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-ink text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
    soft: "bg-white/80 text-slate-800 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-800",
    ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  };
  return (
    <button
      className={`focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
