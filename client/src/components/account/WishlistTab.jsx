import { useState } from "react";
import toast from "react-hot-toast";

const INITIAL_FEATURES = [
  { id: "w1", title: "EPUB to PDF converter", desc: "Support converting EPUB books into standard PDF formatting.", votes: 412, upvoted: false },
  { id: "w2", title: "AI Audio Transcription", desc: "Transcribe MP3/WAV uploads to txt files with speech analysis.", votes: 388, upvoted: false },
  { id: "w3", title: "Batch Watermark PDF", desc: "Watermark thousands of documents simultaneously in queues.", votes: 124, upvoted: false }
];

export default function WishlistTab() {
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [newRequest, setNewRequest] = useState({ title: "", desc: "" });
  const [showForm, setShowForm] = useState(false);

  function handleVote(id) {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const upvoted = !f.upvoted;
          return { ...f, upvoted, votes: f.votes + (upvoted ? 1 : -1) };
        }
        return f;
      })
    );
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newRequest.title.trim() || !newRequest.desc.trim()) return;
    const request = {
      id: `w-${Date.now()}`,
      title: newRequest.title.trim(),
      desc: newRequest.desc.trim(),
      votes: 1,
      upvoted: true
    };
    setFeatures((prev) => [request, ...prev]);
    setNewRequest({ title: "", desc: "" });
    setShowForm(false);
    toast.success("Feature request submitted successfully!");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Feature Wishlist</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Upvote upcoming tool integrations or request new ones for our developers.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="self-start text-xs">
            Request Feature
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-md p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Suggest a Feature</h3>
          
          <label className="block text-sm font-semibold">
            Feature Title
            <input
              type="text"
              required
              placeholder="e.g. OCR for handwritten notes"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={newRequest.title}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea
              rows={3}
              required
              placeholder="Describe what this tool does and how it will help users..."
              className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white resize-y"
              value={newRequest.desc}
              onChange={(e) => setNewRequest((prev) => ({ ...prev, desc: e.target.value }))}
            />
          </label>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      )}

      <div className="space-y-4 max-w-3xl">
        {features.map((f) => (
          <div key={f.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex gap-4 items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
            
            <button
              onClick={() => handleVote(f.id)}
              className={`flex flex-col items-center justify-center border p-2 rounded-lg w-14 shrink-0 transition select-none ${
                f.upvoted
                  ? "bg-slate-950 border-slate-950 text-white dark:bg-white dark:border-white dark:text-slate-950"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              <span className="text-xs font-bold mt-1">{f.votes}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
