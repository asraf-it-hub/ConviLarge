import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../services/api.js";
import Button from "../Button.jsx";

export default function FeedbackTab() {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/feedback", { rating, comments });
      setComments("");
      setRating(5);
      toast.success("Feedback submitted! Thank you for rating ConviLarge.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Give Feedback</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Rate your experience using ConviLarge and suggest improvements.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">How would you rate your overall experience?</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  className={`${
                    star <= rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-350 dark:text-slate-700"
                  } transition hover:scale-110`}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm font-semibold">
          Comments or Suggestions
          <textarea
            rows={5}
            placeholder="Share your thoughts with us..."
            className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white resize-y"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </label>

        <div className="pt-2">
          <Button type="submit" disabled={sending}>
            {sending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}
