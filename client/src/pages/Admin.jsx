import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Activity, AlertTriangle, Bug, CheckCircle2, Database, LifeBuoy, MessageSquare, Star, Trash2, Users } from "lucide-react";
import Button from "../components/Button.jsx";
import { api } from "../services/api.js";
import { formatBytes } from "../utils/tools.js";

function StatCard({ title, value, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-100",
    coral: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-100",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100",
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
  const [tickets, setTickets] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [overviewRes, ticketsRes, feedbacksRes, bugsRes] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/support-tickets").catch(() => ({ data: { tickets: [] } })),
        api.get("/admin/feedbacks").catch(() => ({ data: { feedbacks: [] } })),
        api.get("/admin/bug-reports").catch(() => ({ data: { reports: [] } }))
      ]);

      setData(overviewRes.data);
      setTickets(ticketsRes.data.tickets || []);
      setFeedbacks(feedbacksRes.data.feedbacks || []);
      setBugReports(bugsRes.data.reports || []);
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

  async function updateTicketStatus(id, newStatus) {
    try {
      await api.patch(`/admin/support-tickets/${id}`, { status: newStatus });
      toast.success(`Ticket status updated to ${newStatus}`);
      load();
    } catch {
      toast.error("Failed to update ticket status");
    }
  }

  async function updateBugStatus(id, newStatus) {
    try {
      await api.patch(`/admin/bug-reports/${id}`, { status: newStatus });
      toast.success(`Bug report status updated to ${newStatus}`);
      load();
    } catch {
      toast.error("Failed to update bug report status");
    }
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-brand-600">Admin Panel</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">Admin Control Dashboard</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Manage users, conversions, support tickets, feedbacks, bug reports, and system health.</p>
        </div>
        <Button variant="soft" onClick={load}>Refresh Dashboard</Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard title="Users" value={data?.totals.totalUsers || 0} icon={Users} />
        <StatCard title="Jobs" value={data?.totals.totalJobs || 0} icon={Activity} />
        <StatCard title="Open Support" value={data?.totals.openTickets || 0} icon={LifeBuoy} tone="coral" />
        <StatCard title="Avg Rating" value={`★ ${data?.totals.avgRating || 5.0}`} icon={Star} tone="amber" />
        <StatCard title="Completed" value={data?.totals.completedJobs || 0} icon={CheckCircle2} tone="emerald" />
        <StatCard title="Failed" value={data?.totals.failedJobs || 0} icon={AlertTriangle} tone="coral" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
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
            <p className="flex justify-between"><span>MongoDB</span><strong className="text-emerald-600 dark:text-emerald-400 font-bold">{data?.health.database}</strong></p>
            <p className="flex justify-between"><span>Redis Cache</span><strong className="text-brand-600 dark:text-brand-400 font-bold">{data?.health.redis}</strong></p>
            <p className="flex justify-between"><span>File cleanup</span><strong>24h TTL</strong></p>
          </div>
        </div>
      </section>

      {/* SUPPORT TICKETS SECTION */}
      <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="text-brand-500" size={20} />
            <h2 className="text-lg font-black">Support Tickets ({tickets.length})</h2>
          </div>
          <span className="text-xs font-bold text-slate-500">Latest User Inquiries</span>
        </div>

        {tickets.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {tickets.map((t) => (
              <div key={t._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                      t.status === "resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                      t.status === "in-progress" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                      "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-slate-400">[{t.category}]</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{t.message}</p>
                  <p className="text-xs text-slate-400">
                    Submitted by: <strong>{t.email}</strong> • {dateLabel(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.status !== "resolved" && (
                    <button
                      onClick={() => updateTicketStatus(t._id, "resolved")}
                      className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {t.status === "open" && (
                    <button
                      onClick={() => updateTicketStatus(t._id, "in-progress")}
                      className="px-3 py-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg transition"
                    >
                      In Progress
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 italic">No support tickets submitted yet.</p>
        )}
      </section>

      {/* FEEDBACKS SECTION */}
      <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-brand-500" size={20} />
          <h2 className="text-lg font-black">User Feedbacks ({feedbacks.length})</h2>
        </div>

        {feedbacks.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {feedbacks.map((f) => (
              <div key={f._id} className="py-4 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>{star <= f.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-500">({f.rating}/5)</span>
                  <span className="text-xs text-slate-400">• {f.email || "Anonymous User"} • {dateLabel(f.createdAt)}</span>
                </div>
                {f.comments && <p className="text-sm text-slate-700 dark:text-slate-300">{f.comments}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 italic">No user feedback received yet.</p>
        )}
      </section>

      {/* BUG REPORTS SECTION */}
      <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center gap-2">
          <Bug className="text-rose-500" size={20} />
          <h2 className="text-lg font-black">Bug & Error Reports ({bugReports.length})</h2>
        </div>

        {bugReports.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {bugReports.map((b) => (
              <div key={b._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                      b.priority === "high" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" :
                      b.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}>
                      {b.priority} priority
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      b.status === "resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{b.description}</p>
                  <p className="text-xs text-slate-400">
                    Reported by: <strong>{b.email}</strong> • {dateLabel(b.createdAt)}
                  </p>
                  {b.screenshotUrl && (
                    <a
                      href={b.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline mt-1"
                    >
                      View Screenshot Attachment →
                    </a>
                  )}
                </div>
                <div className="shrink-0">
                  {b.status !== "resolved" && (
                    <button
                      onClick={() => updateBugStatus(b._id, "resolved")}
                      className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 italic">No bug reports submitted yet.</p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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

      <section className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
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
