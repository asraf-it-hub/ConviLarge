import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { handleSocialAuth } = useAuth();
  const runOnce = useRef(false);

  useEffect(() => {
    if (runOnce.current) return;
    runOnce.current = true;

    const code = params.get("code");
    const state = params.get("state"); // "google" or "github"

    if (!code || !state) {
      toast.error("Invalid authentication callback");
      navigate("/auth", { replace: true });
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    api.post("/auth/social-login", { code, provider: state, redirectUri })
      .then(({ data }) => {
        handleSocialAuth(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}!`);
        navigate("/dashboard", { replace: true });
      })
      .catch((error) => {
        console.error("Social login error:", error);
        toast.error(error.response?.data?.message || "Authentication failed");
        navigate("/auth", { replace: true });
      });
  }, [params, navigate, handleSocialAuth]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-mist dark:bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center bg-white dark:bg-slate-900 shadow-soft ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl p-8 max-w-sm w-full"
      >
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-slate-900 dark:text-white" />
        <h2 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">Authenticating</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Securing your session. Please wait a moment...
        </p>
      </motion.div>
    </main>
  );
}
