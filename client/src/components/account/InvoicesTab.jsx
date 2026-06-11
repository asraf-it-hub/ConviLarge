import { useState } from "react";
import toast from "react-hot-toast";

const MOCK_INVOICES = [
  { id: "INV-2026-001", date: "June 11, 2026", amount: "$9.99", status: "Paid" },
  { id: "INV-2026-002", date: "May 11, 2026", amount: "$9.99", status: "Paid" },
  { id: "INV-2026-003", date: "April 11, 2026", amount: "$9.99", status: "Paid" },
  { id: "INV-2026-004", date: "March 11, 2026", amount: "$29.99", status: "Paid" }, // Dev subscription test
  { id: "INV-2026-005", date: "February 11, 2026", amount: "$0.00", status: "Free Trial" }
];

export default function InvoicesTab() {
  const [downloadingId, setDownloadingId] = useState(null);

  function handleDownload(invoiceId) {
    setDownloadingId(invoiceId);
    setTimeout(() => {
      setDownloadingId(null);
      toast.success(`Downloaded ${invoiceId}.pdf successfully!`);
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Invoices & Receipts</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Search and download receipts for all your billing cycles.</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-w-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-4">Invoice Number</th>
                <th className="p-4">Billing Date</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{inv.id}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                  <td className="p-4 text-slate-900 dark:text-white font-medium">{inv.amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      inv.status === "Paid" ? "bg-green-150 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDownload(inv.id)}
                      disabled={downloadingId !== null}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      {downloadingId === inv.id ? "Downloading..." : "Download PDF"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
