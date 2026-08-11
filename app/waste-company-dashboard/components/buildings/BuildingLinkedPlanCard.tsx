"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tags, Loader2, CircleCheck, TriangleAlert, Unlink } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { fetchLinkedPlan, linkBuildingToPlan } from "@/lib/features/finance/services/billingService";
import { fetchSettingsBundle } from "@/lib/features/settings/services/settingsService";
import type { PricingPlan } from "@/lib/features/settings/services/settingsService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

function formatNaira(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "₦0";
  return "₦" + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

interface BuildingLinkedPlanCardProps {
  buildingId: string;
  buildingType: string | null;
  companyId: number;
  onSuccess: () => void;
}

type LinkedMode = "explicit" | "auto" | "none";

export default function BuildingLinkedPlanCard({
  buildingId,
  buildingType,
  companyId,
  onSuccess,
}: BuildingLinkedPlanCardProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [linkedPlan, setLinkedPlan] = useState<PricingPlan | null>(null);
  const [hasExplicitLink, setHasExplicitLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<string>("__auto__");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!buildingId || !companyId) return;
    setLoading(true);

    Promise.all([
      fetchLinkedPlan(buildingId, companyId),
      fetchSettingsBundle(companyId),
    ]).then(([linked, bundle]) => {
      const allPlans = bundle?.plans ?? [];
      // Only show active plans whose effective date is in the past
      const today = new Date().toISOString().slice(0, 10);
      const active = allPlans.filter(
        (p) => p.is_active !== false && (!p.effective_date || p.effective_date <= today)
      );

      setPlans(active);
      setLinkedPlan(linked.plan);
      setHasExplicitLink(linked.hasExplicitLink);
      setSelection(linked.hasExplicitLink && linked.plan ? linked.plan.id : "__auto__");
      setLoading(false);
    });
  }, [buildingId, companyId]);

  const dirty = hasExplicitLink
    ? selection !== linkedPlan?.id
    : selection !== "__auto__";

  const mode: LinkedMode = hasExplicitLink && linkedPlan
    ? "explicit"
    : plans.find((p) => p.building_type === (buildingType || "Residential"))
    ? "auto"
    : "none";

  const resolvedPlan = mode === "explicit"
    ? linkedPlan
    : plans.find((p) => p.building_type === (buildingType || "Residential")) ?? null;

  const submit = async () => {
    setFeedback(null);
    setSaving(true);
    const planId = selection === "__auto__" ? null : selection;
    const result = await linkBuildingToPlan(buildingId, companyId, planId);
    setSaving(false);

    if (!result.ok) {
      setFeedback({ type: "error", text: result.error || "Failed to update linkage." });
      return;
    }
    setFeedback({
      type: "success",
      text: planId ? "Building linked to selected plan." : "Auto-resolution restored.",
    });
    onSuccess();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="h-20 animate-pulse rounded-xl bg-gray-200/60" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-100 bg-white p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
          <Tags size={12} /> Pricing plan
        </p>
        <span className={`${mono.className} rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
          mode === "explicit"
            ? "bg-sky-50 text-sky-700 ring-sky-200"
            : mode === "auto"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-gray-100 text-gray-500 ring-gray-200"
        }`}>
          {mode === "explicit" ? "Explicit" : mode === "auto" ? "Auto" : "None"}
        </span>
      </div>

      {/* Current resolved amount */}
      <div className="mb-3 rounded-xl bg-gray-50/60 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Current monthly amount
        </p>
        <p className={`${display.className} mt-0.5 text-xl font-extrabold tabular-nums text-gray-900`}>
          {resolvedPlan ? formatNaira(resolvedPlan.monthly_fee) : "No plan"}
        </p>
        {resolvedPlan && (
          <p className="mt-0.5 text-[10px] font-medium text-gray-400">
            via {mode === "explicit" ? "explicit link" : `auto-resolved (${resolvedPlan.plan_name})`}
          </p>
        )}
      </div>

      {/* Selection dropdown */}
      <div>
        <label className={`${mono.className} mb-1.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500`}>
          Override (optional)
        </label>
        <select
          value={selection}
          onChange={(e) => setSelection(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="__auto__">Auto-resolve by building type{buildingType ? ` (${buildingType})` : ""}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.plan_name} · {p.building_type} · {formatNaira(p.monthly_fee)}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[10px] font-medium text-gray-400">
          Explicit links always win over building-type resolution. "Auto-resolve" clears the override.
        </p>
      </div>

      {feedback && (
        <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-semibold ${
          feedback.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {feedback.type === "success" ? <CircleCheck size={13} /> : <TriangleAlert size={13} />}
          {feedback.text}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {hasExplicitLink && selection !== "__auto__" && (
          <button
            onClick={() => setSelection("__auto__")}
            className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-[11px] font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100"
          >
            <Unlink size={12} />
            Clear link
          </button>
        )}
        <button
          onClick={submit}
          disabled={saving || !dirty}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <CircleCheck size={12} />}
          {saving ? "Saving…" : "Save linkage"}
        </button>
      </div>
    </motion.div>
  );
}