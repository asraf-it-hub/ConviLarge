import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../services/api.js";
import Button from "../Button.jsx";

export default function PasswordTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [saving, setSaving] = useState(false);

  // Strength score from 0 to 4
  function calculateStrength(pwd) {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  const strength = calculateStrength(form.newPassword);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500"
  ];

  async function handleSave(e) {
    e.preventDefault();

    if (form.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api.put("/auth/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success("Password updated successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  // Check if they need current password (social-only users don't have user.password set initially)
  const isSocialOnly = user.provider !== "local";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Change Password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your password settings. Social users can set a local password here.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        {/* Current Password - Only show if not social-only (or if password exists) */}
        {!isSocialOnly && (
          <label className="block text-sm font-semibold">
            Current Password
            <input
              type="password"
              required
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.currentPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </label>
        )}

        {/* New Password */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold">
            New Password
            <input
              type="password"
              required
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </label>

          {/* Strength Meter */}
          {form.newPassword && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
                <span className={
                  strength === 1 ? "text-red-500" :
                  strength === 2 ? "text-orange-500" :
                  strength === 3 ? "text-yellow-500" :
                  strength === 4 ? "text-green-500" : "text-slate-400"
                }>
                  {strengthLabels[strength - 1] || "Too Short"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${strengthColors[strength - 1] || "w-0"}`}
                  style={{ width: `${(strength / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <label className="block text-sm font-semibold">
          Confirm New Password
          <input
            type="password"
            required
            className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          />
        </label>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Updating Password..." : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
