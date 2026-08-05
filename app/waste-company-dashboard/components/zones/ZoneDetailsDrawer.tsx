"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Building2, CalendarDays, Search, Globe } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { useZoneDetail } from "@/lib/features/zones/hooks/useZones";
import BuildingStatusBadge from "../buildings/BuildingStatusBadge";
import ZoneMap from "./ZoneMap";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = "overview" | "buildings" | "schedule";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "buildings", label: "Buildings" },
  { id: "schedule", label: "Schedule" },
];

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface ZoneDetailsDrawerProps {
  zoneId: string | null;
  onClose: () => void;
}

export default function ZoneDetailsDrawer({ zoneId, onClose }: ZoneDetailsDrawerProps) {
  const { detail, loading } = useZoneDetail(zoneId);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const open = !!zoneId;

  const filteredBuildings = useMemo(() => {
    if (!detail) return [];
    const q = search.trim().toLowerCase();
    if (!q) return detail.buildings;
    return detail.buildings.filter(
      (b) =>
        (b.custom_id || "").toLowerCase().includes(q) ||
        (b.address || "").toLowerCase().includes(q) ||
        (b.estate || "").toLowerCase().includes(q)
    );
  }, [detail, search]);

  const sortedDays = useMemo(() => {
    if (!detail) return [];
    return DAY_ORDER.filter((d) => detail.stats.pickupDayCounts[d] > 0).map((d) => ({
      day: d,
      count: detail.stats.pickupDayCounts[d],
    }));
  }, [detail]);

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
                <div className="min-w-0">
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
                    service zone
                  </p>
                  <h3 className={`${display.className} mt-1 truncate text-xl font-black tracking-tight text-gray-900`}>
                    {detail?.zone.zone_name || "Loading zone…"}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {detail && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`${mono.className} inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ring-1 ${
                    detail.zone.is_active !== false
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-gray-100 text-gray-500 ring-gray-200"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${detail.zone.is_active !== false ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {detail.zone.is_active !== false ? "Active" : "Inactive"}
                  </span>
                  <span className={`${mono.className} rounded-full bg-gray-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200`}>
                    {detail.stats.total} building{detail.stats.total === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 bg-white px-4">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition ${
                    tab === t.id ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
                  } ${mono.className}`}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.span
                      layoutId="zone-tab"
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading && !detail ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200/60" />
                  ))}
                </div>
              ) : detail ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: EASE }}
                  >
                    {tab === "overview" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Buildings", value: detail.stats.total, accent: "text-gray-900" },
                            { label: "Active service", value: detail.stats.activeService, accent: "text-emerald-700" },
                            { label: "Paid", value: detail.stats.paid, accent: "text-emerald-700" },
                            { label: "Unpaid", value: detail.stats.unpaid, accent: detail.stats.unpaid > 0 ? "text-red-600" : "text-gray-400" },
                          ].map((s) => (
                            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4">
                              <p className={`${display.className} text-2xl font-extrabold tabular-nums ${s.accent}`}>
                                {s.value}
                              </p>
                              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Live zone map */}
                        <ZoneMap zone={detail.zone} buildings={detail.buildings} />

                        {/* Service area arrays */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-4">
                          <p className={`${mono.className} mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                            <Globe size={12} /> Service area definition
                          </p>

                          {[
                            { label: "Estates", items: detail.zone.estates },
                            { label: "Streets", items: detail.zone.streets },
                            { label: "Addresses", items: detail.zone.addresses },
                          ].every((g) => !g.items || g.items.length === 0) ? (
                            <p className="text-xs font-semibold text-gray-400">
                              No estates, streets, or addresses listed for this zone.
                            </p>
                          ) : (
                            [
                              { label: "Estates", items: detail.zone.estates },
                              { label: "Streets", items: detail.zone.streets },
                              { label: "Addresses", items: detail.zone.addresses },
                            ].map((g) =>
                              g.items && g.items.length > 0 ? (
                                <div key={g.label} className="mt-3 first:mt-0">
                                  <p className={`${mono.className} mb-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
                                    {g.label} ({g.items.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {g.items.map((item, i) => (
                                      <span key={i} className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {tab === "buildings" && (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search buildings in this zone…"
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          />
                        </div>

                        {filteredBuildings.length === 0 ? (
                          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
                            <Building2 className="mb-2 h-6 w-6 text-gray-300" />
                            <p className="text-xs font-bold text-gray-500">
                              {detail.buildings.length === 0
                                ? "No buildings assigned to this zone yet"
                                : "No buildings match your search"}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredBuildings.slice(0, 50).map((b, i) => (
                              <motion.div
                                key={b.custom_id || i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03, ease: EASE }}
                                className="rounded-xl border border-gray-100 bg-white px-4 py-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900">{b.custom_id}</p>
                                    <p className="truncate text-[11px] font-medium text-gray-400">
                                      {b.address || b.estate || "Address not recorded"}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    <BuildingStatusBadge kind="payment" value={b.payment_status} size="sm" />
                                    <BuildingStatusBadge kind="status" value={b.status} size="sm" />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {tab === "schedule" && (
                      <div className="space-y-3">
                        <p className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                          <CalendarDays size={12} /> Pickup days across zone buildings
                        </p>

                        {sortedDays.length === 0 ? (
                          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
                            <CalendarDays className="mb-2 h-6 w-6 text-gray-300" />
                            <p className="text-xs font-bold text-gray-500">No pickup days configured</p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              Days appear once buildings in this zone have service schedules.
                            </p>
                          </div>
                        ) : (
                          sortedDays.map((d, i) => {
                            const max = Math.max(...sortedDays.map((x) => x.count), 1);
                            const pct = Math.round((d.count / max) * 100);
                            return (
                              <motion.div
                                key={d.day}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05, ease: EASE }}
                                className="rounded-xl border border-gray-100 bg-white p-4"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-sm font-bold text-gray-900">{d.day}</p>
                                  <p className={`${mono.className} text-[11px] font-bold tabular-nums text-gray-500`}>
                                    {d.count} building{d.count === 1 ? "" : "s"}
                                  </p>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }}
                                    className="h-full rounded-full bg-emerald-500"
                                  />
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}