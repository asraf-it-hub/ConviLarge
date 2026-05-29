import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Layers3, LockKeyhole, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import ToolCard from "../components/ToolCard.jsx";
import { categoryMeta, toolCatalog } from "../utils/tools.js";

const popular = ["jpg-to-png", "compress-images", "merge-pdfs", "mp4-to-mp3", "split-pdf", "lock-pdf"];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 dark:bg-slate-900 dark:text-brand-100 dark:ring-brand-900">
            Fast temporary file tools for modern workflows
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-5 max-w-3xl text-5xl font-black leading-tight tracking-normal text-slate-950 dark:text-white sm:text-6xl">
            ConviLarge
          </motion.h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Convert, merge, compress, split, and secure files from a smooth SaaS interface. Guests can work instantly, while accounts keep recent job history while files are available.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/convert">
              <Button>
                Start converting
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="soft">Create account</Button>
            </Link>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 rounded-lg bg-white/85 p-4 shadow-soft ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/85 dark:ring-slate-800">
          {popular.map((id, index) => {
            const tool = toolCatalog.find((item) => item.id === id);
            const Icon = tool.icon;
            return (
              <Link key={id} to={`/${tool.category}?tool=${id}`} className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800">
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
        </motion.div>
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
          ["Do I need an account?", "No. Tools work for guests. Accounts only add recent conversion history."],
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
        ConviLarge. Built for fast, temporary, account-optional file work.
      </footer>
    </main>
  );
}
