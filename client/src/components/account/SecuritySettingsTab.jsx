import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function SecuritySettingsTab() {
  const [alerts, setAlerts] = useState({
    loginAlerts: true,
    weeklyReport: false,
    newDeviceAlert: true
  });
  const [saving, setSaving] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Security preferences saved!");
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Security Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure your session preferences and security alerts.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Security Notifications</h3>
          
          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Email Login Alerts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Receive an email whenever someone logs into your account.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={alerts.loginAlerts}
              onChange={(e) => setAlerts((prev) => ({ ...prev, loginAlerts: e.target.checked }))}
            />
          </div>

          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">New Device Alerts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get notified immediately when a login occurs from an unrecognized device.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={alerts.newDeviceAlert}
              onChange={(e) => setAlerts((prev) => ({ ...prev, newDeviceAlert: e.target.checked }))}
            />
          </div>

          <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Security Summary</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weekly report containing login locations, active tasks, and usage rates.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              checked={alerts.weeklyReport}
              onChange={(e) => setAlerts((prev) => ({ ...prev, weeklyReport: e.target.checked }))}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
