import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, DownloadCloud, History, Layers3, LockKeyhole, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import HomeToolSearch from "../components/HomeToolSearch.jsx";
import ToolCard from "../components/ToolCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { categoryMeta, toolCatalog } from "../utils/tools.js";

const popular = ["jpg-to-png", "compress-images", "merge-pdfs", "mp4-to-mp3", "split-pdf", "lock-pdf"];
const accountBenefits = [
  [Sparkles, "No login required", "Use file tools instantly as a guest. Start with the task first, not an account form."],
  [History, "Unlimited AI tools", "Create an account for free unlimited AI tools access, plus organized AI runs and recent activity."],
  [DownloadCloud, "Return for downloads", "Accounts make it easier to come back to recent work and download outputs during the storage window."]
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 dark:bg-slate-900 dark:text-brand-100 dark:ring-brand-900">
            All essential file tools, available without login
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-5 max-w-3xl text-5xl font-black leading-tight tracking-normal text-slate-950 dark:text-white sm:text-6xl">
            ConviLarge
          </motion.h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Convert, merge, compress, split, secure, and enhance files from a smooth SaaS interface. Work instantly as a guest, then sign in for free unlimited AI tools access, saved history, and future downloads in one polished workspace.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            {["No login to start", "Free unlimited AI after login", "Future downloads"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <CheckCircle2 size={16} className="text-brand-500" />
                {item}
              </span>
            ))}
          </div>
          <HomeToolSearch />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/convert">
              <Button>
                Start converting
                <ArrowRight size={18} />
              </Button>
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button variant="soft">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="soft">Create account</Button>
              </Link>
            )}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-lg bg-slate-950 shadow-soft ring-1 ring-slate-800">
          <img src="/brand/ConviLargeLogo.png" alt="ConviLarge file conversion logo" className="aspect-[16/9] w-full object-cover" />
          <div className="grid gap-2 bg-white/95 p-4 dark:bg-slate-900/95">
            {popular.slice(0, 4).map((id, index) => {
              const tool = toolCatalog.find((item) => item.id === id);
              const Icon = tool.icon;
              return (
                <Link key={id} to={tool.route} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-100">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-950 dark:text-white">{tool.title}</p>
                    <p className="text-sm text-slate-500">Queue-ready processing and 24-hour cleanup</p>
                  </div>
                  <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 px-4 py-12 backdrop-blur dark:border-slate-800 dark:bg-slate-950/45 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-wide text-brand-600 dark:text-brand-300">Account optional, experience premium</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Start immediately. Sign in only when it adds value.</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
              ConviLarge keeps the first step simple: every core file tool is available without login. An account upgrades the workflow with free unlimited AI tools access, saved activity, easier repeat access, and a more continuous AI experience.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {accountBenefits.map(([Icon, title, description], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06 }}
                className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-slate-900 dark:ring-slate-800"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/45 dark:text-brand-100">
                  <Icon size={21} />
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Popular tools</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">The everyday actions most people need first.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((id) => <ToolCard key={id} tool={toolCatalog.find((tool) => tool.id === id)} />)}
        </div>
      </section>

      {Object.entries(categoryMeta).map(([category, meta]) => (
        <section key={category} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">{meta.title}</h2>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{meta.summary}</p>
            </div>
            <Link to={`/${category}`} className="text-sm font-bold text-brand-600">View all</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {toolCatalog.filter((tool) => tool.category === category).slice(0, 4).map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>
      ))}

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        {[
          [Zap, "Fast uploads"],
          [Layers3, "Modular processors"],
          [LockKeyhole, "Secure temp storage"],
          [Clock, "24-hour cleanup"]
        ].map(([Icon, title]) => (
          <div key={title} className="rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <Icon className="text-coral" />
            <h3 className="mt-4 font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Built for a production MVP with graceful service fallbacks.</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black">FAQ</h2>
        {[
          ["Do I need an account?", "No. Core tools work for guests, so you can start immediately without signing in."],
          ["What do I get after login?", "Accounts add free unlimited AI tools access, recent history, a smoother AI workspace, and easier access to future downloads while files are available."],
          ["How long are files stored?", "Uploaded and processed files are temporary and cleaned after 24 hours."],
          ["Can this scale later?", "Yes. The API is modular, queue-ready, and storage is isolated for future S3 migration."]
        ].map(([question, answer]) => (
          <div key={question} className="mt-4 rounded-lg bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <p className="flex items-center gap-2 font-bold"><CheckCircle2 size={18} className="text-brand-500" />{question}</p>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{answer}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        ConviLarge. Professional file tools with account-optional access and premium workspace benefits.
      </footer>
    </main>
  );
}
