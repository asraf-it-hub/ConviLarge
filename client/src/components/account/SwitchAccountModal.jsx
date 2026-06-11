import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function SwitchAccountModal({ isOpen, onClose }) {
  const [targetAccount, setTargetAccount] = useState("");

  if (!isOpen) return null;

  function handleSwitch(e) {
    e.preventDefault();
    if (!targetAccount.trim()) return;
    toast.success(`Switched account to ${targetAccount}!`);
    onClose();
    // Simulate page reload to update settings
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-soft ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 z-10 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Switch Account</h3>
          <p className="text-xs text-slate-500 mt-1">Quickly sign in to another account on this browser.</p>
        </div>

        <form onSubmit={handleSwitch} className="space-y-4">
          <label className="block text-sm font-semibold">
            Account Email or Username
            <input
              type="text"
              required
              placeholder="e.g. dev@convilarge.com"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
            />
          </label>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <Button type="submit">Switch Account</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
