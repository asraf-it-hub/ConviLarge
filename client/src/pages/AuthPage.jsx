import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../components/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else await signup(form);
      toast.success("Welcome to ConviLarge");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
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
          {mode === "signup" && (
            <label className="mt-5 block text-sm font-semibold">
              Name
              <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
          )}
          <label className="mt-5 block text-sm font-semibold">
            Email
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="mt-5 block text-sm font-semibold">
            Password
            <input className="focus-ring mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          <Button className="mt-6 w-full" disabled={busy}>{busy ? "Please wait" : mode === "login" ? "Login" : "Create account"}</Button>
        </form>
      </section>
    </main>
  );
}
