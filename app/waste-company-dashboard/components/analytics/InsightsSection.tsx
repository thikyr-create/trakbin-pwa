"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Sora } from "next/font/google";
import type { Insight } from "@/lib/core/analytics/metricsEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TONE_STYLE = {
  positive: { Icon: TrendingUp, classes: "border-emerald-100 bg-emerald-50/60 text-emerald-800", iconTile: "bg-emerald-100 text-emerald-600" },
  warning: { Icon: AlertTriangle, classes: "border-amber-100 bg-amber-50/60 text-amber-800", iconTile: "bg-amber-100 text-amber-600" },
  neutral: { Icon: Info, classes: "border-gray-100 bg-gray-50/60 text-gray-600", iconTile: "bg-gray-100 text-gray-500" },
} as const;

export default function InsightsSection({ insights }: { insights: Insight[] }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <Sparkles className="h-4 w-4" />
          </span>
          Insights
        </h2>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
          rule-generated · live
        </span>
      </div>

      <div className="space-y-2.5 px-6 py-5">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="mb-2 h-7 w-7 text-gray-300" />
            <p className="text-sm font-bold text-gray-500">Nothing to report yet</p>
            <p className="mt-1 text-xs text-gray-400">Insights appear as activity accumulates.</p>
          </div>
        ) : (
          insights.map((ins, i) => {
            const style = TONE_STYLE[ins.tone];
            const Icon = style.Icon;
            return (
              <motion.div
                key={`${ins.tone}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${style.classes}`}
              >
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.iconTile}`}>
                  <Icon size={14} />
                </span>
                <p className="text-xs font-semibold leading-relaxed">{ins.text}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}