export default function SkeletonPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-lg bg-white/80 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />
        ))}
      </div>
    </main>
  );
}
