import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

const LANGUAGES = [
  { code: "en", name: "English (US)" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "hi", name: "हिन्दी" }
];

export default function LanguageTab() {
  const [lang, setLang] = useState("en");
  const [saving, setSaving] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Regional preferences saved!");
    }, 700);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Language & Regional Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Select your preferred system language and date format parameters.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        <label className="block text-sm font-semibold">
          Preferred Language
          <select
            className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Date Format
          <select className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white">
            <option>MM/DD/YYYY (e.g. 06/11/2026)</option>
            <option>DD/MM/YYYY (e.g. 11/06/2026)</option>
            <option>YYYY-MM-DD (e.g. 2026-06-11)</option>
          </select>
        </label>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving Locale..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
