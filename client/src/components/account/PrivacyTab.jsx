import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function PrivacyTab() {
  const [isPublic, setIsPublic] = useState(() => {
    try {
      return localStorage.getItem("convilarge_public_profile") === "true";
    } catch {
      return false;
    }
  });
  const [exporting, setExporting] = useState(false);

  function handlePublicToggle(e) {
    const val = e.target.checked;
    setIsPublic(val);
    try {
      localStorage.setItem("convilarge_public_profile", String(val));
    } catch {}
    toast.success(val ? "Public profile search enabled" : "Public profile search disabled");
  }

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      try {
        const userStr = localStorage.getItem("convilarge_user");
        const user = userStr ? JSON.parse(userStr) : { email: "user@convilarge.com", role: "user" };
        const userProjects = JSON.parse(localStorage.getItem("convilarge_user_projects") || "[]");
        const favoriteTools = JSON.parse(localStorage.getItem("convilarge_favorite_tools") || "[]");
        const billingInfo = JSON.parse(localStorage.getItem("convilarge_billing_info") || "{}");

        const exportData = {
          exportDate: new Date().toISOString(),
          app: "ConviLarge File Converter & AI Engine",
          userProfile: user,
          billingDetails: billingInfo,
          userSavedProjects: userProjects,
          favoriteTools: favoriteTools,
          sessionDetails: {
            userAgent: navigator.userAgent,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `convilarge_account_data_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        toast.success("Account data export JSON downloaded!");
      } catch (e) {
        toast.error("Failed to generate export file.");
      }
    }, 1000);
  }

  function handleDeleteAccount() {
    const confirmation = prompt("To confirm deletion, type 'DELETE' below:");
    if (confirmation === "DELETE") {
      toast.success("Account deletion request submitted.");
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
          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Public Profile Search</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Allow other users to search your username to share files easily.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white cursor-pointer"
              checked={isPublic}
              onChange={handlePublicToggle}
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
