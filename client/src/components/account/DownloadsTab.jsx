import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, HardDrive, RefreshCw } from "lucide-react";
import { api, downloadUrl } from "../../services/api.js";
import { formatBytes } from "../../utils/tools.js";

export default function DownloadsTab() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchDownloads() {
    setLoading(true);
    api.get("/dashboard")
      .then(({ data }) => {
        const jobs = data.jobs || [];
        // Filter jobs that are completed and have downloadable files
        const files = jobs.filter((j) => j.status === "completed" && j.outputFile);
        setDownloads(files);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not fetch downloads list");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchDownloads();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Downloads</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Access and download output files from your successful conversions.</p>
        </div>
        <button
          onClick={fetchDownloads}
          className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="space-y-4 max-w-3xl">
        {loading ? (
          [1, 2].map((n) => (
            <div key={n} className="h-20 animate-pulse border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl" />
          ))
        ) : downloads.length > 0 ? (
          downloads.map((dl) => {
            const fileName = dl.outputFile?.name || "unnamed";
            const dateStr = dl.createdAt ? new Date(dl.createdAt).toLocaleDateString() : "Unknown";
            return (
              <div key={dl.id || dl._id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm max-w-xs sm:max-w-md truncate">
                      {fileName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatBytes(dl.outputFile.size)} • {dateStr}
                    </p>
                  </div>
                </div>

                <a
                  href={downloadUrl(dl.outputFile.downloadUrl)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-3.5 py-2 rounded-lg transition"
                >
                  <Download size={12} />
                  Download
                </a>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <HardDrive className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-600" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No downloads available</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Any successful file conversion output will be displayed here for instant downloads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
