import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function ReportProblemTab() {
  const [form, setForm] = useState({ priority: "medium", description: "", screenshotName: "" });
  const [reporting, setReporting] = useState(false);

  function handleScreenshot(e) {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, screenshotName: file.name }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setReporting(true);
    setTimeout(() => {
      setReporting(false);
      setForm({ priority: "medium", description: "", screenshotName: "" });
      toast.success("Bug report submitted! Our engineering team will review it.");
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Report a Problem</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Encountered a bug or error? Send a detailed report directly to our engineers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold sm:col-span-2">
            Priority Level
            <select
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="low">Low (Minor visual issue)</option>
              <option value="medium">Medium (Tool fails but workarounds exist)</option>
              <option value="high">High (Unable to use core website features)</option>
            </select>
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Describe the Problem
            <textarea
              rows={5}
              required
              placeholder="What actions were you performing? What was the expected outcome and what actually happened? Include error codes..."
              className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white resize-y"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>

          {/* Screenshot upload simulation */}
          <div className="sm:col-span-2 space-y-2">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Attach Screenshot (optional)</span>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg cursor-pointer transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
              </label>
              <span className="text-xs text-slate-400">
                {form.screenshotName || "No file selected."}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={reporting}>
            {reporting ? "Submitting Report..." : "Submit Bug Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
