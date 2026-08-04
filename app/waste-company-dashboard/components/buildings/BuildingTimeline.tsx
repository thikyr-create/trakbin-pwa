"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import type { TimelineEntry } from "@/lib/features/buildings/utils/buildingHelpers";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TONE_DOT: Record<TimelineEntry["tone"], string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

interface BuildingTimelineProps {
  entries: TimelineEntry[];
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BuildingTimeline({ entries }: BuildingTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <History className="mb-2 h-7 w-7 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No events recorded yet</p>
      </div>
    );
  }

  // Newest first for reading order
  const ordered = [...entries].reverse();

  return (
    <div className="relative space-y-0 pl-6">
      {/* Rail */}
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gray-200" />

      {ordered.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.04, ease: EASE }}
          className="relative pb-5 last:pb-0"
        >
          <span
            className={`absolute -left-6 top-1 h-[15px] w-[15px] rounded-full ring-4 ring-white ${TONE_DOT[entry.tone]}`}
          />
          <p className="text-sm font-bold leading-tight text-gray-900">{entry.label}</p>
          <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
            {formatDateTime(entry.at)}
            {entry.detail ? ` · ${entry.detail}` : ""}
          </p>
        </motion.div>
      ))}
    </div>
  );
}