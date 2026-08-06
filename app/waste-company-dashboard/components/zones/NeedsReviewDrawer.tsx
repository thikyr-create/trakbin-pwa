"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ListChecks, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { UnassignedBuilding, ZoneRecord } from "@/lib/features/zones/services/zoneService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface NeedsReviewDrawerProps {
  open: boolean;
  items: UnassignedBuilding[];
  zones: ZoneRecord[];
  onAssign: (buildingId: string, zoneName: string, hasAssignment: boolean) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export default function NeedsReviewDrawer({ open, items, zones, onAssign, onClose }: NeedsReviewDrawerProps) {
  const [local, setLocal] = useState<UnassignedBuilding[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLocal(items);
      // Pre-select the engine's low-confidence suggestion when present
      const pre: Record<string, string> = {};
      items.forEach((i) => {
        if (i.resolution) pre[i.custom_id] = i.resolution.zone_name;
      });
      setSelections(pre);
    }
  }, [open, items]);

  const handleAssign = async (b: UnassignedBuilding) => {
    const zoneName = selections[b.custom_id];
    if (!zoneName) return;

    setBusyId(b.custom_id);
    const result = await onAssign(b.custom_id, zoneName, b.has_assignment);
    setBusyId(null);

    if (result.ok) {
      setLocal((prev) => prev.filter((x) => x.custom_id !== b.custom_id));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[910] flex h-full w-full max-w-lg flex-col bg-[#f6f7f6] shadow-2xl"
          >
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600`}>
                    needs review
                  </p>
                  <h3 className={`${display.className} mt-1 text-xl font-black tracking-tight text-gray-900`}>
                    Zone assignment review
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-gray-500">
                    {local.length} building{local.length === 1 ? "" : "s"} awaiting manual decision
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {local.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-10 text-center">
                  <CheckCircle2 className="mb-2 h-7 w-7 text-emerald-400" />
                  <p className="text-sm font-bold text-gray-600">Review queue is clear</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Every building is assigned to a zone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {local.map((b, i) => (
                    <motion.div
                      key={b.custom_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.04, ease: EASE }}
                      className="rounded-2xl border border-gray-100 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900">{b.custom_id}</p>
                          <p className="truncate text-[11px] font-medium text-gray-400">
                            {b.address || b.estate || "No address recorded"}
                          </p>
                        </div>
                        {b.latitude != null && b.longitude != null ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-200">
                            <MapPin size={10} />
                            GPS
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 ring-1 ring-gray-200">
                            No GPS
                          </span>
                        )}
                      </div>

                      {/* Engine's honest verdict */}
                      {b.resolution ? (
                        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                          Engine suggests <strong>{b.resolution.zone_name}</strong>
                          {b.resolution.distance_km != null ? ` (${b.resolution.distance_km} km from center)` : ""} — low confidence, confirm below.
                        </p>
                      ) : (
                        <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-500">
                          No zone matched — assign manually.
                        </p>
                      )}

                      {/* Manual assignment */}
                      <div className="mt-3 flex items-center gap-2">
                        <select
                          value={selections[b.custom_id] || ""}
                          onChange={(e) => setSelections((p) => ({ ...p, [b.custom_id]: e.target.value }))}
                          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="">Select zone…</option>
                          {zones.map((z) => (
                            <option key={z.id} value={z.zone_name}>{z.zone_name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(b)}
                          disabled={!selections[b.custom_id] || busyId === b.custom_id}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === b.custom_id ? <Loader2 size={13} className="animate-spin" /> : <ListChecks size={13} />}
                          Assign
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}