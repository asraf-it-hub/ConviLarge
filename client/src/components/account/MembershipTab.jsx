import { Check } from "lucide-react";

const BENEFITS = [
  "Convert unlimited files daily",
  "High priority processing speed",
  "Maximum upload size up to 1GB per file",
  "Store files on our cloud for up to 7 days",
  "Access to all Premium AI tools and document extractors",
  "24/7 Priority support hotline"
];

export default function MembershipTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Membership Benefits</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Discover all premium benefits and features included with your subscription.</p>
      </div>

      <div className="max-w-xl p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">You are a Premium Member</h3>
            <p className="text-xs text-slate-400">Thank you for supporting ConviLarge!</p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Active Features Included:</h4>
          <ul className="space-y-2">
            {BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
