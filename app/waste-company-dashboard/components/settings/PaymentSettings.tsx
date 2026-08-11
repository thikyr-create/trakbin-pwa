"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, CircleCheck, TriangleAlert } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";
import SettingsToggleRow from "./SettingsToggleRow";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

export default function PaymentSettings({ bundle, loading, saveSettings }: SettingsSectionProps) {
  const [gateway, setGateway] = useState("paystack");
  const [settlementBank, setSettlementBank] = useState("");
  const [autoSettlement, setAutoSettlement] = useState("weekly");
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const s = bundle?.settings;

  useEffect(() => {
    if (s) {
      setGateway(s.payment_gateway ?? "paystack");
      setSettlementBank(s.settlement_bank ?? "");
      setAutoSettlement(s.auto_settlement ?? "weekly");
      setWalletEnabled(s.wallet_enabled ?? true);
    }
  }, [bundle]);

  const dirty =
    !!s &&
    (gateway !== s.payment_gateway || settlementBank !== (s.settlement_bank ?? "") ||
      autoSettlement !== s.auto_settlement || walletEnabled !== s.wallet_enabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    const result = await saveSettings({
      payment_gateway: gateway,
      settlement_bank: settlementBank.trim() || null,
      auto_settlement: autoSettlement,
      wallet_enabled: walletEnabled,
    });

    setSaving(false);
    setFeedback(
      result.ok
        ? { type: "success", text: "Payment settings saved." }
        : { type: "error", text: result.error || "Failed to save payment settings." }
    );
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CreditCard size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Payments
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            gateway · settlement · wallet
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-4">
        <div>
          <label className={labelCls}>Payment gateway</label>
          <select value={gateway} onChange={(e) => setGateway(e.target.value)} className={inputCls}>
            <option value="paystack">Paystack</option>
          </select>
          <p className="mt-1.5 text-[11px] font-medium text-gray-400">
            Additional gateways (Flutterwave, etc.) arrive when approved.
          </p>
        </div>

        <div>
          <label className={labelCls}>Settlement bank</label>
          <input type="text" value={settlementBank} onChange={(e) => setSettlementBank(e.target.value)} placeholder="e.g. Access Bank" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Auto settlement</label>
          <select value={autoSettlement} onChange={(e) => setAutoSettlement(e.target.value)} className={inputCls}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <SettingsToggleRow label="Building wallets" desc="Buildings hold prepaid balances for autopay" value={walletEnabled} onChange={setWalletEnabled} />

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
          {saving ? "Saving…" : "Save payment settings"}
        </button>
      </form>
    </div>
  );
}