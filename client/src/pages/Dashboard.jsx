import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { api, downloadUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatBytes } from "../utils/tools.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard")
      .then(({ data }) => setJobs(data.jobs))
      .catch((error) => toast.error(error.response?.data?.message || "Could not load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-slate-950 dark:text-white">Dashboard</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Recent conversions for {user.name}</p>
      <section className="mt-8 rounded-lg bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {loading ? (
          <div className="h-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ) : jobs.length ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {jobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-bold">{job.toolType}</p>
                  <p className="text-sm text-slate-500">{job.outputFile ? `${job.outputFile.name} • ${formatBytes(job.outputFile.size)}` : job.status}</p>
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
