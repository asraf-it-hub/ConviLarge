import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function PrivacyTab() {
  const [isPublic, setIsPublic] = useState(false);
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast.success("Account data package (JSON) downloaded!");
    }, 1500);
  }

  function handleDeleteAccount() {
    const confirmation = prompt("To confirm deletion, type 'DELETE' below:");
    if (confirmation === "DELETE") {
      toast.success("Account deletion request submitted. Our support team will process it shortly.");
    } else if (confirmation !== null) {
      toast.error("Confirmation word did not match.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Privacy & Data Controls</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Control account visibility, export your data, or permanently delete your account.</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Toggle options */}
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Public Profile Search</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Allow other users to search your username to share files easily.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </div>
        </div>

        {/* Data export */}
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Export Account Details</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Download a copy of all information stored on our servers (profile details, login location history, and recent file records).
          </p>
          <Button onClick={handleExport} disabled={exporting} variant="soft" className="text-xs">
            {exporting ? "Exporting..." : "Request Data Export"}
          </Button>
        </div>

        {/* Danger zone */}
        <div className="p-5 border border-red-200 dark:border-red-950/40 rounded-xl bg-red-50/20 dark:bg-red-950/10 space-y-3">
          <h3 className="font-bold text-red-600 dark:text-red-400 text-base">Danger Zone</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Once you delete your account, there is no going back. All active files, billing details, and subscription tiers will be permanently removed.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="text-xs font-bold text-white bg-red-600 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-650 px-3.5 py-2 rounded-lg transition"
          >
            Delete Account...
          </button>
        </div>
      </div>
    </div>
  );
}
