"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, CircleCheck, TriangleAlert } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";
import SettingsToggleRow from "./SettingsToggleRow";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export default function NotificationSettings({ bundle, loading, saveSettings }: SettingsSectionProps) {
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [push, setPush] = useState(true);
  const [driver, setDriver] = useState(true);
  const [payment, setPayment] = useState(true);
  const [issues, setIssues] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const s = bundle?.settings;

  useEffect(() => {
    if (s) {
      setEmail(s.notify_email ?? true);
      setSms(s.notify_sms ?? false);
      setPush(s.notify_push ?? true);
      setDriver(s.notify_driver ?? true);
      setPayment(s.notify_payment ?? true);
      setIssues(s.notify_issues ?? true);
    }
  }, [bundle]);

  const dirty =
    !!s &&
    (email !== s.notify_email || sms !== s.notify_sms || push !== s.notify_push ||
      driver !== s.notify_driver || payment !== s.notify_payment || issues !== s.notify_issues);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    const result = await saveSettings({
      notify_email: email,
      notify_sms: sms,
      notify_push: push,
      notify_driver: driver,
      notify_payment: payment,
      notify_issues: issues,
    });

    setSaving(false);
    setFeedback(
      result.ok
        ? { type: "success", text: "Notification preferences saved." }
        : { type: "error", text: result.error || "Failed to save notification preferences." }
    );
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Bell size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Notifications
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            channels the notification engine uses
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-3">
        <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400`}>Channels</p>
        <SettingsToggleRow label="Email notifications" desc="Invoices, receipts, and alerts via email" value={email} onChange={setEmail} />
        <SettingsToggleRow label="SMS" desc="Text message alerts (requires SMS provider approval)" value={sms} onChange={setSms} />
        <SettingsToggleRow label="Push notifications" desc="In-app and mobile push alerts" value={push} onChange={setPush} />

        <p className={`${mono.className} pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400`}>Alert types</p>
        <SettingsToggleRow label="Driver alerts" desc="Route assignments and collection tasks" value={driver} onChange={setDriver} />
        <SettingsToggleRow label="Payment alerts" desc="Successful payments and failed attempts" value={payment} onChange={setPayment} />
        <SettingsToggleRow label="Issue reports" desc="Environmental issues raised by buildings" value={issues} onChange={setIssues} />

        <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
          <p className="text-[11px] font-semibold leading-relaxed text-sky-800">
            Preferences persist now. Delivery activates when the notification engine ships —
            SMS requires an approved provider before it can send.
          </p>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {feedback.type === "success" ? <CircleCheck size={14} /> : <TriangleAlert size={14} />}
            {feedback.text}
          </div>
        )}

        <button type="submit" disabled={saving || !dirty}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CircleCheck size={15} />}
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}