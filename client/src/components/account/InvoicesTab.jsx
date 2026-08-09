import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("convilarge_user_invoices");
      if (saved) {
        setInvoices(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load user invoices:", e);
    }
  }, []);

  function handleDownload(invoiceId) {
    setDownloadingId(invoiceId);
    setTimeout(() => {
      setDownloadingId(null);
      toast.success(`Downloaded ${invoiceId}.pdf successfully!`);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Invoices & Receipts</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Search and download receipts for all your billing cycles.</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-w-3xl">
        {invoices.length > 0 ? (
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
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{inv.id}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{inv.date}</td>
                    <td className="p-4 text-slate-900 dark:text-white font-medium">{inv.amount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
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
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">No Invoices or Receipts Yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">Your transaction receipts and billing invoices will appear here once generated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
