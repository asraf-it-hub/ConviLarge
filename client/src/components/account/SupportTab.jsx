import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Button from "../Button.jsx";

export default function SupportTab() {
  const [form, setForm] = useState({ subject: "", category: "billing", message: "" });
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    try {
      await api.post("/support", form);
      setForm({ subject: "", category: "billing", message: "" });
      toast.success("Support ticket submitted! Our team will respond shortly.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit support ticket");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Contact Support</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Submit a support ticket and our developers will help resolve your issues.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">
            Ticket Subject
            <input
              type="text"
              required
              placeholder="e.g. Failed to compress large PDF"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Category
            <select
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="billing">Billing & Membership</option>
              <option value="technical">Technical Error</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Message Details
            <textarea
              rows={5}
              required
              placeholder="Describe your issue in detail. If applicable, mention which tool fails and any error messages..."
              className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white resize-y"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </label>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={sending}>
            {sending ? "Sending Ticket..." : "Submit Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}
