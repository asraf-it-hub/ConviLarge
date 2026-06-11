import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Button from "../Button.jsx";

export default function LogoutModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  function handleConfirm() {
    logout();
    onClose();
    toast.success("Logged out successfully");
    navigate("/", { replace: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-soft ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 z-10 space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Log Out</h3>
          <p className="text-xs text-slate-500">Are you sure you want to end your active session on ConviLarge?</p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-650"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
