import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Button from "../Button.jsx";

export default function BillingTab() {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("convilarge_billing_info");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    const userStr = localStorage.getItem("convilarge_user");
    let userEmail = "";
    if (userStr) {
      try { userEmail = JSON.parse(userStr).email || ""; } catch {}
    }
    return {
      billingEmail: userEmail,
      taxId: "",
      companyName: "",
      address: "",
      city: "",
      zip: "",
      state: ""
    };
  });

  const [saving, setSaving] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem("convilarge_billing_info", JSON.stringify(form));
    } catch {}
    setTimeout(() => {
      setSaving(false);
      toast.success("Billing information saved successfully!");
    }, 600);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Billing Information</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update corporate tax status, default company fields, and billing receipts destinations.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">
            Billing Email Receipt Destination
            <input
              type="email"
              required
              placeholder="e.g. billing@yourcompany.com"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.billingEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, billingEmail: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Tax ID / VAT Registration Number (optional)
            <input
              type="text"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              placeholder="e.g. EU123456789"
              value={form.taxId}
              onChange={(e) => setForm((prev) => ({ ...prev, taxId: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Company Name (optional)
            <input
              type="text"
              placeholder="Your Business or Organization Name"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.companyName}
              onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold sm:col-span-2">
            Street Address (optional)
            <input
              type="text"
              placeholder="Street address or P.O. Box"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </label>

          <label className="block text-sm font-semibold">
            City (optional)
            <input
              type="text"
              placeholder="City"
              className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              State / Province
              <input
                type="text"
                placeholder="State"
                className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              />
            </label>

            <label className="block text-sm font-semibold">
              Zip / Postal Code
              <input
                type="text"
                placeholder="Zip code"
                className="focus-ring mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 text-slate-900 dark:text-white"
                value={form.zip}
                onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
              />
            </label>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving Billing Details..." : "Save Billing Info"}
          </Button>
        </div>
      </form>
    </div>
  );
}
