import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, CalendarClock, Download } from "lucide-react";
import DashboardStatCard from "../components/DashboardStatCard.jsx";
import { api, downloadUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatBytes } from "../utils/tools.js";

function activityLabel(dateValue) {
  if (!dateValue) return "No activity yet";

  const activity = new Date(dateValue);
  const today = new Date();
  const activityDate = new Date(activity.getFullYear(), activity.getMonth(), activity.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDiff = Math.round((todayDate - activityDate) / 86400000);

  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return `${dayDiff} days ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard")
      .then(({ data }) => {
        setJobs(data.jobs);
        setStats(data.stats);
      })
      .catch((error) => toast.error(error.response?.data?.message || "Could not load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const mostUsedTool = stats?.mostUsedTool;
  const lastActivity = stats?.lastActivity;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-slate-950 dark:text-white">Dashboard</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Recent conversions for {user.name}</p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <DashboardStatCard
          icon={BarChart3}
          label="Most Used Tool"
          value={mostUsedTool?.name || "No activity yet"}
          detail={mostUsedTool?.count ? `${mostUsedTool.count} completed ${mostUsedTool.count === 1 ? "job" : "jobs"}` : null}
          loading={loading}
        />
        <DashboardStatCard
          icon={CalendarClock}
          label="Last Activity"
          value={activityLabel(lastActivity?.completedAt)}
          detail={lastActivity?.toolName || null}
          loading={loading}
        />
      </section>

      <section className="mt-8 rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {loading ? (
          <div className="h-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ) : jobs.length ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {jobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-bold">{job.toolType}</p>
                  <p className="text-sm text-slate-500">{job.outputFile ? `${job.outputFile.name} - ${formatBytes(job.outputFile.size)}` : job.status}</p>
                </div>
                {job.outputFile && (
                  <a href={downloadUrl(job.outputFile.downloadUrl)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    <Download size={16} />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center">
            <p className="font-bold">No recent conversions yet</p>
            <p className="mt-2 text-sm text-slate-500">Run a tool while logged in and it will appear here until cleanup removes the file.</p>
          </div>
        )}
      </section>
    </main>
  );
}
