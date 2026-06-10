import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Github } from "lucide-react";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

const GoogleIcon = () => (
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext?.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else await signup(form);
      toast.success("Welcome to ConviLarge");
      navigate(next, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSocialLogin(provider) {
    setBusy(true);
    try {
      const { data } = await api.get("/auth/config");
      const redirectUri = `${window.location.origin}/auth/callback`;
      if (provider === "google") {
        if (!data.googleClientId) {
          toast.error("Google login is not configured on this server");
          return;
        }
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          data.googleClientId
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=google`;
      } else if (provider === "github") {
        if (!data.githubClientId) {
          toast.error("GitHub login is not configured on this server");
          return;
        }
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
          data.githubClientId
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github`;
      }
    } catch (error) {
      toast.error("Could not fetch OAuth configuration");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl content-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 md:grid-cols-2">
        <div className="bg-ink p-8 text-white dark:bg-slate-950">
          <h1 className="text-3xl font-black">Account workspace</h1>
          <p className="mt-4 leading-7 text-slate-300">Use tools without signing in, or keep recent job history while files are still available.</p>
        </div>
        <form onSubmit={submit} className="p-6 sm:p-8">
          <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {["login", "signup"].map((item) => (
              <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${mode === item ? "bg-white shadow-sm dark:bg-slate-950" : "text-slate-500"}`}>
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              disabled={busy}
              className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition focus-ring"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin("github")}
              disabled={busy}
              className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition focus-ring"
            >
              <Github className="mr-2 h-5 w-5 text-slate-900 dark:text-slate-100" />
              Continue with GitHub
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-slate-200 dark:border-slate-800 lg:w-1/4"></span>
            <span className="text-xs text-center text-slate-500 uppercase dark:text-slate-400">or use email</span>
            <span className="w-1/5 border-b border-slate-200 dark:border-slate-800 lg:w-1/4"></span>
          </div>

          {mode === "signup" && (
            <label className="mt-5 block text-sm font-semibold">
              Name
              <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
          )}
          <label className="mt-5 block text-sm font-semibold">
            Email
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label className="mt-5 block text-sm font-semibold">
            Password
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          <Button className="mt-6 w-full" disabled={busy}>{busy ? "Please wait" : mode === "login" ? "Login" : "Create account"}</Button>
        </form>
      </section>
    </main>
  );
}
