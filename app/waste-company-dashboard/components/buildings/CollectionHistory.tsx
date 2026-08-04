"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import BuildingStatusBadge from "./BuildingStatusBadge";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface CollectionHistoryProps {
  collections: any[];
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CollectionHistory({ collections }: CollectionHistoryProps) {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <Trash2 className="mb-2 h-7 w-7 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No collections recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
        {collections.length} collection{collections.length === 1 ? "" : "s"}
      </p>

      {collections.map((c, i) => (
        <motion.div
          key={c.id ?? i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">
              {formatDateTime(c.collection_date)}
            </p>
            <p className="truncate text-[11px] font-medium text-gray-400">
              {c.hauler_name || "Hauler not recorded"}
              {c.notes ? ` · ${c.notes}` : ""}
            </p>
          </div>
          <BuildingStatusBadge kind="collection" value={c.status} size="sm" />
        </motion.div>
      ))}
    </div>
  );
}