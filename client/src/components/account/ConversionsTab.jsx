import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Download, Search, RefreshCw, XCircle, CheckCircle, HelpCircle } from "lucide-react";
import { api, downloadUrl } from "../../services/api.js";
import { formatBytes } from "../../utils/tools.js";

export default function ConversionsTab() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  function fetchJobs() {
    setLoading(true);
    api.get("/dashboard")
      .then(({ data }) => {
        setJobs(data.jobs || []);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Could not load conversions history");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const query = search.toLowerCase().trim();
    const toolTypeMatches = job.toolType?.toLowerCase().includes(query);
    const fileNameMatches = job.outputFile?.name?.toLowerCase().includes(query) || 
                            job.meta?.originalName?.toLowerCase().includes(query);
    const matchesSearch = !query || toolTypeMatches || fileNameMatches;

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">My Conversions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage your recent document conversion history.</p>
        </div>
        <button
          onClick={fetchJobs}
          className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tool name or file name..."
            className="focus-ring h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="focus-ring h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white w-full sm:w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
        </select>
      </div>

      {/* Conversions Table/List */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                </div>
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Tool & Original File</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredJobs.map((job) => {
                  const dateStr = job.createdAt ? new Date(job.createdAt).toLocaleString() : "Unknown";
                  const fileName = job.outputFile?.name || job.meta?.outputFile?.name || "unnamed";
                  return (
                    <tr key={job.id || job._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white capitalize">{job.toolType?.replace("-", " ")}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                          {fileName}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {job.outputFile?.size ? formatBytes(job.outputFile.size) : "-"}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          job.status === "completed" ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" :
                          job.status === "failed" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" :
                          "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                        }`}>
                          {job.status === "completed" && <CheckCircle size={12} />}
                          {job.status === "failed" && <XCircle size={12} />}
                          {job.status !== "completed" && job.status !== "failed" && <RefreshCw size={12} className="animate-spin" />}
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {job.outputFile ? (
                          <a
                            href={downloadUrl(job.outputFile.downloadUrl)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <Download size={12} />
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No output</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-600" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No conversions found</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Run some document conversion tools or refine your search/filter parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
