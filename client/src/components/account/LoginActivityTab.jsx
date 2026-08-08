import { useState, useMemo } from "react";
import toast from "react-hot-toast";

function detectUserDevice() {
  const ua = navigator.userAgent;
  let os = "Desktop";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  let browser = "Web Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";

  return { os, browser };
}

export default function LoginActivityTab() {
  const deviceInfo = useMemo(() => detectUserDevice(), []);

  const [sessions, setSessions] = useState([
    {
      id: "current-session",
      current: true,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      ip: "Active Connection",
      location: "Current Device",
      lastActive: "Just now"
    }
  ]);

  function handleRevoke(sessionId, name) {
    if (confirm(`Are you sure you want to log out of the session on ${name}?`)) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(`Logged out of session on ${name}`);
    }
  }

  function handleRevokeAll() {
    if (confirm("Are you sure you want to log out of all other active sessions?")) {
      setSessions((prev) => prev.filter((s) => s.current));
      toast.success("Logged out of all other sessions!");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Login Activity</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage your active web sessions across different devices.</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAll}
            className="self-start text-xs font-bold text-red-600 hover:text-red-500 dark:text-red-400 border border-red-200 hover:bg-red-50 dark:border-red-950/30 dark:hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition"
          >
            Log Out Other Sessions
          </button>
        )}
      </div>

      <div className="space-y-4 max-w-3xl">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`flex items-start justify-between p-4 border rounded-xl bg-white dark:bg-slate-900 ${
              s.current ? "border-slate-300 ring-2 ring-slate-900/5 dark:border-slate-700 dark:ring-white/5" : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Device Icon */}
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 mt-1">
                {s.os.toLowerCase().includes("ios") || s.os.toLowerCase().includes("android") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{s.os}</h3>
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{s.browser}</p>
                  {s.current && (
                    <span className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Current Session
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <strong>IP:</strong> {s.ip}
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>Location:</strong> {s.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>Active:</strong> {s.lastActive}
                  </span>
                </div>
              </div>
            </div>

            {!s.current && (
              <button
                onClick={() => handleRevoke(s.id, `${s.os} (${s.browser})`)}
                className="text-xs text-red-500 font-bold hover:underline self-center p-2"
                aria-label="Revoke session"
              >
                Log Out
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
