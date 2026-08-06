"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tags, Plus, Pencil, History, Loader2, CheckCircle2, AlertTriangle, X, Link2 } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";
import type { PricingPlan } from "@/lib/features/settings/services/settingsService";
import { autoLinkBuildingsToPlans } from "@/lib/features/finance/services/billingService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const BUILDING_TYPES = ["Residential", "Commercial", "Industrial"] as const;

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

function formatNaira(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "₦0";
  return "₦" + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function PricingSettings({ bundle, loading, addPlan, changeFee }: SettingsSectionProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);

  // Create form
  const [planName, setPlanName] = useState("");
  const [buildingType, setBuildingType] = useState<string>("Residential");
  const [fee, setFee] = useState("");

  // Change-fee form
  const [newFee, setNewFee] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-link state
  const [linking, setLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<{ linked: number; skipped: number } | null>(null);

  const plans = bundle?.plans ?? [];
  const history = bundle?.history ?? [];
  const companyId = bundle?.profile?.id ?? null;

  const resetForms = () => {
    setPlanName("");
    setBuildingType("Residential");
    setFee("");
    setNewFee("");
    setEffectiveDate("");
    setReason("");
    setFeedback(null);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const feeNum = Number(fee);
    if (!planName.trim()) { setFeedback({ type: "error", text: "Plan name is required." }); return; }
    if (!Number.isFinite(feeNum) || feeNum <= 0) { setFeedback({ type: "error", text: "Monthly fee must be a positive number." }); return; }

    setSaving(true);
    const result = await addPlan({
      plan_name: planName.trim(),
      building_type: buildingType,
      monthly_fee: feeNum,
    });
    setSaving(false);

    if (!result.ok) {
      setFeedback({ type: "error", text: result.error || "Failed to create plan." });
      return;
    }
    resetForms();
    setShowCreate(false);
  };

  const submitFeeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setFeedback(null);

    const feeNum = Number(newFee);
    if (!Number.isFinite(feeNum) || feeNum <= 0) { setFeedback({ type: "error", text: "New fee must be a positive number." }); return; }
    if (!effectiveDate) { setFeedback({ type: "error", text: "Effective date is required." }); return; }

    setSaving(true);
    const result = await changeFee(editingPlan.id, {
      monthly_fee: feeNum,
      effective_date: effectiveDate,
      reason: reason.trim() || "Fee update",
    });
    setSaving(false);

    if (!result.ok) {
      setFeedback({ type: "error", text: result.error || "Failed to update fee." });
      return;
    }
    resetForms();
    setEditingPlan(null);
  };

  const handleAutoLink = async () => {
    if (!companyId) return;
    setLinking(true);
    setLinkResult(null);
    const result = await autoLinkBuildingsToPlans(companyId);
    setLinking(false);
    setLinkResult(result);
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Tags size={18} />
            </span>
            <div>
              <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
                Service pricing
              </h2>
              <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                plans → billing engine → invoices
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowCreate(true); setEditingPlan(null); setFeedback(null); }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <Plus size={14} />
            New plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
            <Tags className="mb-2 h-7 w-7 text-gray-300" />
            <p className="text-sm font-bold text-gray-500">No pricing plans yet</p>
            <p className="mt-1 max-w-sm text-xs text-gray-400">
              Create a plan per building type — the billing engine reads it when generating invoices.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {plans.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04, ease: EASE }}
                className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{p.plan_name}</p>
                    <span className={`${mono.className} mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200`}>
                      {p.building_type}
                    </span>
                  </div>
                  <button
                    onClick={() => { setEditingPlan(p); setShowCreate(false); setNewFee(String(p.monthly_fee)); setFeedback(null); }}
                    title="Change fee"
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-sky-600"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                <p className={`${display.className} mt-3 text-2xl font-extrabold tabular-nums text-gray-900`}>
                  {formatNaira(p.monthly_fee)}
                  <span className="ml-1 text-xs font-bold text-gray-400">/ month</span>
                </p>
                <p className={`${mono.className} mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400`}>
                  effective {formatDate(p.effective_date)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create plan form */}
      <AnimatePresence>
        {showCreate && (
          <motion.form
            onSubmit={submitCreate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <p className={`${display.className} text-sm font-extrabold text-gray-900`}>New pricing plan</p>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
              <div>
                <label className={labelCls}>Plan name</label>
                <input type="text" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Standard Residential" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Building type</label>
                <select value={buildingType} onChange={(e) => setBuildingType(e.target.value)} className={inputCls}>
                  {BUILDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Monthly fee (₦)</label>
                <input type="number" min={1} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="5000" className={inputCls} />
              </div>
            </div>
            <div className="px-6 pb-5">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? "Creating…" : "Create plan"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Change fee form */}
      <AnimatePresence>
        {editingPlan && (
          <motion.form
            onSubmit={submitFeeChange}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden rounded-[24px] border border-sky-200/70 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/40 px-6 py-4">
              <div>
                <p className={`${display.className} text-sm font-extrabold text-gray-900`}>
                  Change fee — {editingPlan.plan_name}
                </p>
                <p className="text-[11px] font-semibold text-sky-700">
                  Current: {formatNaira(editingPlan.monthly_fee)} · existing invoices stay unchanged
                </p>
              </div>
              <button type="button" onClick={() => setEditingPlan(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
              <div>
                <label className={labelCls}>New monthly fee (₦)</label>
                <input type="number" min={1} value={newFee} onChange={(e) => setNewFee(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Effective date</label>
                <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Reason</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Annual review" className={inputCls} />
              </div>
            </div>
            <div className="px-6 pb-5">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {saving ? "Saving…" : "Apply fee change"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

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

      {/* Building linkage */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <Link2 size={18} />
            </span>
            <div>
              <p className={`${display.className} text-sm font-extrabold text-gray-900`}>Building linkage</p>
              <p className="mt-0.5 max-w-md text-[11px] font-medium text-gray-400">
                Links every unlinked building to the matching plan by its building type.
                Existing invoices keep their amounts — linkage affects future generation.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoLink}
            disabled={linking || plans.length === 0 || !companyId}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 disabled:opacity-50"
          >
            {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            {linking ? "Linking…" : "Auto-link all buildings"}
          </button>
        </div>

        {linkResult && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
              result:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              {linkResult.linked} linked
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
              linkResult.skipped > 0
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-gray-100 text-gray-500 ring-gray-200"
            }`}>
              {linkResult.skipped} skipped (no matching plan or already linked)
            </span>
          </div>
        )}
      </div>

      {/* Pricing history */}
      <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
        <p className={`${mono.className} mb-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          <History size={12} /> Pricing history · immutable audit trail
        </p>

        {history.length === 0 ? (
          <p className="text-xs font-semibold text-gray-400">No price changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 20).map((h, i) => (
              <motion.div
                key={h.id || i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">
                    {h.plan_name} <span className="text-gray-400">·</span> {h.building_type}
                  </p>
                  <p className="text-[10px] font-medium text-gray-400">
                    {formatDate(h.effective_date)}{h.reason ? ` · ${h.reason}` : ""}
                  </p>
                </div>
                <p className={`${display.className} text-sm font-extrabold tabular-nums text-gray-900`}>
                  {formatNaira(h.monthly_fee)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}