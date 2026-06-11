import { useState } from "react";

const FAQS = [
  { q: "How long are my files stored?", a: "To ensure absolute security, all uploaded and converted documents are automatically purged from our servers after 24 hours. You can also manually delete them anytime." },
  { q: "What is the maximum file size limit?", a: "Free guest users can upload files up to 25MB. Logged in users get up to 250MB, and Premium members can upload files up to 1GB." },
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your subscription at any time. You will continue to have access to Pro features until the end of your current billing cycle." }
];

export default function HelpCenterTab() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Help Center & FAQs</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Find answers to common questions or browse our usage tutorials.</p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-sm"
              >
                <span>{faq.q}</span>
                <span className="text-slate-400 font-normal">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
