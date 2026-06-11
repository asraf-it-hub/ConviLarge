import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function SubscriptionTab() {
  const [loading, setLoading] = useState(false);

  function handleUpgrade(planName) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Redirecting to checkout for ${planName} Plan!`);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Subscription Plan</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">View your current membership level, daily task usage, and billing settings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan card */}
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Current Plan</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-white">ConviLarge Pro</h3>
          </div>
          <div className="text-slate-900 dark:text-white font-bold text-lg">
            $9.99 <span className="text-xs text-slate-500 font-normal">/ month</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Next renewal date: July 11, 2026</p>
        </div>

        {/* Usage card */}
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-4 md:col-span-2">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Daily API Usage</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">12 / 100 conversions completed</h3>
          </div>
          
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: "12%" }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>12% used</span>
              <span>88 left today</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">Daily limit resets in 14 hours.</p>
        </div>
      </div>

      {/* Plan comparison CTA */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Available Upgrade Tiers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {/* Plan 1 */}
          <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col justify-between h-56">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Enterprise Plan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited daily jobs, priority processing queues, dedicated support channels, and custom file retention rates.</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">$49.99/mo</span>
              <button
                onClick={() => handleUpgrade("Enterprise")}
                disabled={loading}
                className="text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-3.5 py-2 rounded-lg transition"
              >
                Upgrade to Enterprise
              </button>
            </div>
          </div>

          {/* Plan 2 */}
          <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col justify-between h-56">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Developer API</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Access document utilities programmatically via custom Webhooks, REST endpoints, and SDK tokens with 10k monthly runs.</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">$29.99/mo</span>
              <button
                onClick={() => handleUpgrade("Developer API")}
                disabled={loading}
                className="text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 px-3.5 py-2 rounded-lg transition"
              >
                Subscribe API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
