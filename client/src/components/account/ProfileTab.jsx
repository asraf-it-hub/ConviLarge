import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";
import Button from "../Button.jsx";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Japan", "Brazil", "South Africa", "Other"
];

export default function ProfileTab() {
  const { user, updateAuthUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    country: user.country || COUNTRIES[0],
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || ""
  });
  const [saving, setSaving] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      updateAuthUser(data.user);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">My Profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update your personal information and profile picture.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-white font-black text-2xl dark:bg-white dark:text-slate-950 ring-4 ring-slate-100 dark:ring-slate-800">
                {form.name[0]?.toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-slate-950 hover:bg-slate-800 text-white text-xs p-1.5 rounded-full cursor-pointer shadow-md dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 border border-white dark:border-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Avatar Photo</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG or WEBP. Max size 2MB.</p>
            {form.avatarUrl && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, avatarUrl: "" }))}
                className="text-xs text-red-500 font-semibold mt-1 hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">
            Full Name
            <input
              type="text"
              required
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Username
            <input
              type="text"
              placeholder="e.g. johndoe"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value.replace(/\s+/g, "") }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Email Address (Read-only)
            <input
              type="email"
              disabled
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 cursor-not-allowed"
              value={user.email}
            />
          </label>

          <label className="block text-sm font-semibold">
            Phone Number
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Country
            <select
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Bio
            <textarea
              rows={4}
              placeholder="Tell us a little bit about yourself..."
              className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white resize-y"
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </label>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
