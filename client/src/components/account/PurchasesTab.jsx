import { useState } from "react";
import { CreditCard } from "lucide-react";

export default function PurchasesTab() {
  const [purchases] = useState([]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Purchase History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Review all premium orders and credit purchases on your account.</p>
      </div>

      {purchases.length > 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-w-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Item Purchased</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">{p.id}</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{p.item}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.date}</td>
                    <td className="p-4 text-slate-900 dark:text-white font-medium">{p.amount}</td>
                    <td className="p-4">
                      <span className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl py-12 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
          <CreditCard className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-600" />
          <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No purchase history found</h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When you purchase API credits or subscription upgrades, your transaction invoices will be listed here.
          </p>
        </div>
      )}
    </div>
  );
}
