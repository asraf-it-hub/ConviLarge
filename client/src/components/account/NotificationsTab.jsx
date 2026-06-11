import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    conversions: true,
    newsletter: false,
    security: true,
    offers: false
  });
  const [saving, setSaving] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Notification preferences updated!");
    }, 700);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Notification Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Control what messages and alerts you receive from ConviLarge.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">File Conversion Updates</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receive system notifications when asynchronous conversions complete.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={prefs.conversions}
              onChange={(e) => setPrefs((prev) => ({ ...prev, conversions: e.target.checked }))}
            />
          </div>

          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Security Alerts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receive warnings about unauthorized logins and account modifications.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={prefs.security}
              onChange={(e) => setPrefs((prev) => ({ ...prev, security: e.target.checked }))}
            />
          </div>

          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Newsletter</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get tips, trick guides, and new tool announcements.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={prefs.newsletter}
              onChange={(e) => setPrefs((prev) => ({ ...prev, newsletter: e.target.checked }))}
            />
          </div>

          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Promotions & Discounts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get updates on special sales and subscription coupons.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={prefs.offers}
              onChange={(e) => setPrefs((prev) => ({ ...prev, offers: e.target.checked }))}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
