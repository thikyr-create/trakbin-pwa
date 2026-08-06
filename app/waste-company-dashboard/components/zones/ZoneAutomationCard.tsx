"use client";

import { motion } from "framer-motion";
import { Sparkles, Loader2, ListChecks } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { AutoAssignResult } from "@/lib/features/zones/services/zoneService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface ZoneAutomationCardProps {
  enabled: boolean;
  running: boolean;
  lastResult: AutoAssignResult | null;
  onToggle: (enabled: boolean) => void;
  onRun: () => void;
  onOpenReview: () => void;
}

export default function ZoneAutomationCard({
  enabled,
  running,
  lastResult,
  onToggle,
  onRun,
  onOpenReview,
}: ZoneAutomationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`${display.className} flex items-center gap-2 text-sm font-extrabold text-gray-900`}>
            <Sparkles size={15} className="text-emerald-600" />
            Zone auto-assignment
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            Polygon → radius → estate/street matching. Low-confidence matches always go to review — never guessed silently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* On/off switch */}
          <div className="flex items-center gap-2">
            <span className={`${mono.className} text-[9px] font-bold uppercase tracking-wider ${enabled ? "text-emerald-600" : "text-gray-400"}`}>
              {enabled ? "Auto on" : "Manual"}
            </span>
            <button
              type="button"
              onClick={() => onToggle(!enabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "left-6" : "left-1"}`} />
            </button>
          </div>

          {/* Run now */}
          <button
            onClick={onRun}
            disabled={running}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {running ? "Assigning…" : "Assign unassigned now"}
          </button>
        </div>
      </div>

      {/* Last run summary */}
      {lastResult && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
            last run:
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {lastResult.assigned} assigned
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
            lastResult.needsReview.length > 0
              ? "bg-amber-50 text-amber-700 ring-amber-200"
              : "bg-gray-100 text-gray-500 ring-gray-200"
          }`}>
            {lastResult.needsReview.length} need{lastResult.needsReview.length === 1 ? "s" : ""} review
          </span>
          {lastResult.needsReview.length > 0 && (
            <button
              onClick={onOpenReview}
              className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700"
            >
              <ListChecks size={13} />
              Open review
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}