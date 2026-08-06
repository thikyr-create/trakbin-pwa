"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AlertTriangle, Download, RotateCcw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const DEFAULT_SETTINGS = {
  billing_cycle: "monthly",
  cutoff_day: 25,
  invoice_day: 1,
  due_day: 5,
  grace_period_days: 2,
  late_fee_enabled: false,
  auto_invoice_generation: true,
  default_collection_days: [],
  working_hours_start: "07:00",
  working_hours_end: "17:00",
  max_stops_per_route: 60,
  route_optimization: true,
  auto_assign_drivers: false,
  notify_email: true,
  notify_sms: false,
  notify_push: true,
  notify_driver: true,
  notify_payment: true,
  notify_issues: true,
  payment_gateway: "paystack",
  settlement_bank: null,
  auto_settlement: "weekly",
  wallet_enabled: true,
  theme: "light",
  language: "en",
  timezone: "Africa/Lagos",
  date_format: "DD MMM YYYY",
  distance_unit: "km",
  map_style: "satellite",
};

export default function DangerZone({ bundle, saveSettings }: SettingsSectionProps) {
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const companyId = bundle?.profile?.id ?? null;

  const handleExport = async () => {
    if (!companyId) return;
    setExporting(true);
    setFeedback(null);

    try {
      const [buildings, invoices, zones, plans, settings] = await Promise.all([
        supabase.from("Buildings").select("*").eq("company_id", companyId),
        supabase.from("invoices").select("*").eq("company_id", companyId),
        supabase.from("company_zones").select("*").eq("company_id", companyId),
        supabase.from("pricing_plans").select("*").eq("company_id", companyId),
        supabase.from("company_settings").select("*").eq("company_id", companyId),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        company_id: companyId,
        buildings: buildings.data || [],
        invoices: invoices.data || [],
        zones: zones.data || [],
        pricing_plans: plans.data || [],
        settings: settings.data || [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trakbin-export-company-${companyId}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setFeedback({ type: "success", text: "Export downloaded. Your data stays in Trakbin — this is a copy, not a deletion." });
    } catch {
      setFeedback({ type: "error", text: "Export failed. Please try again." });
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    if (!confirmReset) return;
    setResetting(true);
    setFeedback(null);

    const result = await saveSettings(DEFAULT_SETTINGS);

    setResetting(false);
    setConfirmReset(false);
    setFeedback(
      result.ok
        ? { type: "success", text: "All settings restored to defaults." }
        : { type: "error", text: result.error || "Reset failed." }
    );
  };

  return (
    <div className="rounded-[24px] border border-red-200/70 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
          <AlertTriangle size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Danger zone
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            every action here requires confirmation
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/40 px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800">Export company data</p>
            <p className="text-[11px] font-medium text-gray-400">
              Buildings, invoices, zones, pricing, and settings as JSON. Non-destructive.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !companyId}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Preparing…" : "Export"}
          </button>
        </div>

        {/* Reset settings */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800">Reset all settings</p>
              <p className="text-[11px] font-medium text-gray-500">
                Restores billing, collection, notification, payment, and preference defaults.
                Invoices and buildings are untouched.
              </p>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600"
              >
                <RotateCcw size={14} />
                Reset…
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {resetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Confirm reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Planned destructive actions — honest */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-4 py-4">
          <XCircle size={16} className="shrink-0 text-gray-300" />
          <div>
            <p className="text-xs font-bold text-gray-500">Deactivate / delete company</p>
            <p className="text-[11px] font-medium text-gray-400">
              Requires an account-lifecycle foundation (active flag + approval flow) — planned with Phase SEC.
              Nothing destructive is offered before it can be done safely.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
          feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {feedback.text}
        </div>
      )}
    </div>
  );
}