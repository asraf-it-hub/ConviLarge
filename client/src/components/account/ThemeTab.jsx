import { useTheme } from "../../context/ThemeContext.jsx";
import { Sun, Moon } from "lucide-react";

export default function ThemeTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Appearance Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Choose how ConviLarge looks. Change theme preferences for comfortable reading.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        {/* Light theme option */}
        <button
          onClick={() => setTheme("light")}
          className={`p-5 border rounded-xl bg-white text-left transition space-y-3 shadow-sm hover:shadow ${
            theme === "light"
              ? "border-slate-900 ring-2 ring-slate-900/5"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="p-2 bg-slate-100 rounded-lg text-slate-900 w-9 h-9 flex items-center justify-center">
            <Sun size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Light Mode</h3>
            <p className="text-xs text-slate-400 mt-0.5">Classic clean interface with high contrast elements.</p>
          </div>
        </button>

        {/* Dark theme option */}
        <button
          onClick={() => setTheme("dark")}
          className={`p-5 border rounded-xl text-left transition space-y-3 shadow-sm hover:shadow ${
            theme === "dark"
              ? "border-white bg-slate-900 text-white ring-2 ring-white/5"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white"
          }`}
        >
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-200 w-9 h-9 flex items-center justify-center">
            <Moon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Dark Mode</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sleek dark interface designed to reduce eye strain.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
