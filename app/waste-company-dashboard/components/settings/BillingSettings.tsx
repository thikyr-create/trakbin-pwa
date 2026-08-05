"use client";

import { useEffect, useState } from "react";
import { Receipt, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function BillingSettings({ bundle, loading, saveSettings }: SettingsSectionProps) {
  const [cutoffDay, setCutoffDay] = useState(25);
  const [invoiceDay, setInvoiceDay] = useState(1);
  const [dueDay, setDueDay] = useState(5);
  const [gracePeriod, setGracePeriod] = useState(2);
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const s = bundle?.settings;

  useEffect(() => {
    if (s) {
      setCutoffDay(s.cutoff_day ?? 25);
      setInvoiceDay(s.invoice_day ?? 1);
      setDueDay(s.due_day ?? 5);
      setGracePeriod(s.grace_period_days ?? 2);
      setLateFeeEnabled(s.late_fee_enabled ?? false);
      setAutoInvoice(s.auto_invoice_generation ?? true);
    }
  }, [bundle]);

  const dirty =
    !!s &&
    (cutoffDay !== s.cutoff_day ||
      invoiceDay !== s.invoice_day ||
      dueDay !== s.due_day ||
      gracePeriod !== s.grace_period_days ||
      lateFeeEnabled !== s.late_fee_enabled ||
      autoInvoice !== s.auto_invoice_generation);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const inRange = (n: number, max: number) => Number.isInteger(n) && n >= 1 && n <= max;
    if (!inRange(cutoffDay, 28) || !inRange(invoiceDay, 28) || !inRange(dueDay, 28)) {
      setFeedback({ type: "error", text: "Cutoff, invoice, and due days must be whole numbers between 1 and 28." });
      return;
    }
    if (!Number.isInteger(gracePeriod) || gracePeriod < 0 || gracePeriod > 14) {
      setFeedback({ type: "error", text: "Grace period must be between 0 and 14 days." });
      return;
    }

    setSaving(true);
    const result = await saveSettings({
      cutoff_day: cutoffDay,
      invoice_day: invoiceDay,
      due_day: dueDay,
      grace_period_days: gracePeriod,
      late_fee_enabled: lateFeeEnabled,
      auto_invoice_generation: autoInvoice,
    });
    setSaving(false);

    setFeedback(
      result.ok
        ? { type: "success", text: "Billing rules updated. Future invoices follow the new schedule." }
        : { type: "error", text: result.error || "Failed to save billing rules." }
    );
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Receipt size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Billing rules
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            drives the billing engine · existing invoices never change
          </p>
        </div>
      </div>

      {/* Live flow preview */}
      <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
        <p className={`${mono.className} mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
          billing flow preview
        </p>
        <p className="text-xs font-semibold leading-relaxed text-emerald-900">
          Service up to the <strong>{ordinal(cutoffDay)}</strong> → invoice generated on the{" "}
          <strong>{ordinal(invoiceDay)}</strong> → payment due by the <strong>{ordinal(dueDay)}</strong> →{" "}
          <strong>{gracePeriod} day{gracePeriod === 1 ? "" : "s"}</strong> grace
          {lateFeeEnabled ? " → late fees apply after grace." : " → no late fees."}
        </p>
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Cutoff day</label>
            <input type="number" min={1} max={28} value={cutoffDay} onChange={(e) => setCutoffDay(Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Invoice day</label>
            <input type="number" min={1} max={28} value={invoiceDay} onChange={(e) => setInvoiceDay(Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Due day</label>
            <input type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Grace period (days)</label>
          <input type="number" min={0} max={14} value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} className={`${inputCls} max-w-[140px]`} />
        </div>

        <div className="space-y-3">
          {[
            { label: "Late fees enabled", desc: "Fees apply after the grace period ends", value: lateFeeEnabled, set: setLateFeeEnabled },
            { label: "Automatic invoice generation", desc: "Invoices generate on the invoice day without manual action", value: autoInvoice, set: setAutoInvoice },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-gray-700">{t.label}</p>
                <p className="text-[11px] font-medium text-gray-400">{t.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => t.set(!t.value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${t.value ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${t.value ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {feedback.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !dirty}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Saving…" : "Save billing rules"}
        </button>
      </form>
    </div>
  );
}