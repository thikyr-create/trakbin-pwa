"use client";

import { motion } from "framer-motion";
import { MapPin, UserRound, CalendarDays } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import BuildingStatusBadge from "./BuildingStatusBadge";
import type { BuildingRecord } from "@/lib/features/buildings/services/buildingService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface BuildingCardProps {
  building: BuildingRecord;
  onClick: () => void;
  index: number;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

export default function BuildingCard({ building, onClick, index }: BuildingCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 12) * 0.03, ease: EASE }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-[20px] border border-gray-200/80 bg-white p-5 text-left shadow-sm transition-shadow hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />

      <div className="relative mb-3 flex items-start justify-between gap-2">
        <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
          {building.custom_id || "N/A"}
        </p>
        <BuildingStatusBadge kind="status" value={building.status} size="sm" />
      </div>

      <h3 className={`${display.className} relative truncate text-lg font-black tracking-tight text-gray-900`}>
        {building.address || "No address"}
      </h3>
      <p className="relative mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
        <MapPin size={12} className="text-emerald-500" />
        {building.estate || building.zone_name || "No estate"}
      </p>

      <div className="relative mt-4 space-y-2 border-t border-gray-100 pt-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <UserRound size={13} className="text-gray-400" />
          {building.assigned_driver_name || "No driver assigned"}
        </p>
        <p className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <CalendarDays size={13} className="text-gray-400" />
          Next: {formatDate(building.next_collection)}
        </p>
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <BuildingStatusBadge kind="payment" value={building.payment_status} size="sm" />
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
          {(building.pickup_days || []).map((d) => d.slice(0, 3)).join(" · ") || "No schedule"}
        </span>
      </div>
    </motion.button>
  );
}