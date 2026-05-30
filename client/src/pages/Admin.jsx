import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, AlertTriangle, CheckCircle2, Database, Trash2, Users } from "lucide-react";
import Button from "../components/Button.jsx";
import { api } from "../services/api.js";
import { formatBytes } from "../utils/tools.js";

function StatCard({ title, value, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-100",
    coral: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-100",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
  };

  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={20} />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function dateLabel(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data: next } = await api.get("/admin/overview");
      setData(next);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteUser(id) {
    if (!window.confirm("Delete this user? Their jobs will become guest jobs.")) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("User deleted");
    load();
  }

  async function deleteJob(id) {
    if (!window.confirm("Delete this job record?")) return;
    await api.delete(`/admin/jobs/${id}`);
    toast.success("Job deleted");
    load();
  }

  const maxDaily = useMemo(() => Math.max(1, ...(data?.dailyUsage || []).map((item) => item.jobs)), [data]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg bg-white dark:bg-slate-900" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-brand-600">Admin</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">Traffic Dashboard</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Users, conversions, failures, tool usage, and system health.</p>
        </div>
        <Button variant="soft" onClick={load}>Refresh</Button>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard title="Users" value={data?.totals.totalUsers || 0} icon={Users} />
        <StatCard title="Jobs" value={data?.totals.totalJobs || 0} icon={Activity} />
        <StatCard title="Guest Jobs" value={data?.totals.guestJobs || 0} icon={Users} tone="slate" />
        <StatCard title="Logged In Jobs" value={data?.totals.loggedInJobs || 0} icon={Database} />
        <StatCard title="Completed" value={data?.totals.completedJobs || 0} icon={CheckCircle2} />
        <StatCard title="Failed" value={data?.totals.failedJobs || 0} icon={AlertTriangle} tone="coral" />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-black">Daily Usage</h2>
          <div className="mt-5 flex h-56 items-end gap-2">
            {(data?.dailyUsage || []).map((item) => (
              <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t bg-brand-500" style={{ height: `${Math.max(8, (item.jobs / maxDaily) * 190)}px` }} title={`${item.date}: ${item.jobs}`} />
                <span className="w-full truncate text-center text-xs text-slate-500">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-black">System Health</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex justify-between"><span>MongoDB</span><strong>{data?.health.database}</strong></p>
            <p className="flex justify-between"><span>Redis</span><strong>{data?.health.redis}</strong></p>
            <p className="flex justify-between"><span>File cleanup</span><strong>24h TTL</strong></p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-black">Most Used Tools</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {(data?.toolUsage || []).map((tool) => (
              <div key={tool.toolType} className="flex items-center justify-between gap-3 py-3">
                <span className="font-semibold">{tool.toolType}</span>
                <span className="text-sm text-slate-500">{tool.count} uses, {tool.failures} failed</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg font-black">Recent Users</h2>
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {(data?.recentUsers || []).map((user) => (
              <div key={user._id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name} <span className="text-xs text-brand-600">{user.role}</span></p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                </div>
                <Button variant="ghost" onClick={() => deleteUser(user._id)} title="Delete user">
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h2 className="text-lg font-black">Recent Jobs</h2>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {(data?.recentJobs || []).map((job) => (
            <div key={job._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="font-semibold">{job.toolType} <span className="text-xs text-slate-500">{job.status}</span></p>
                <p className="text-sm text-slate-500">
                  {job.user?.email || "Guest"} • {dateLabel(job.createdAt)}
                  {job.outputFile?.size ? ` • ${formatBytes(job.outputFile.size)}` : ""}
                </p>
                {job.error && <p className="mt-1 text-sm text-red-500">{job.error}</p>}
              </div>
              <Button variant="ghost" onClick={() => deleteJob(job._id)} title="Delete job">
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
