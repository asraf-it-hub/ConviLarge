export default function DashboardStatCard({ icon: Icon, label, value, detail, loading }) {
  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-4 space-y-3">
              <div className="h-6 w-36 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : (
            <>
              <p className="mt-3 truncate text-2xl font-black text-slate-950 dark:text-white">{value}</p>
              {detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}
            </>
          )}
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-100">
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}
