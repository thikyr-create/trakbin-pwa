"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Building2, Zap, Layers } from "lucide-react";
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { useZones } from "@/lib/features/zones/hooks/useZones";
import { useEventRefetch } from "@/lib/hooks/useEventRefetch";
import type { ZoneRecord, AutoAssignResult } from "@/lib/features/zones/services/zoneService";
import ZoneTable from "./ZoneTable";
import ZoneDetailsDrawer from "./ZoneDetailsDrawer";
import CreateZoneModal from "./CreateZoneModal";
import EditZoneModal from "./EditZoneModal";
import ZoneSearch from "./ZoneSearch";
import ZoneAutomationCard from "./ZoneAutomationCard";
import NeedsReviewDrawer from "./NeedsReviewDrawer";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function ZonesPage() {
  const {
    zones, loading, error, refetch,
    createZone, updateZone, deleteZone, toggleZone, mergeZone,
    autoAssignEnabled, runAutoAssign, assignBuilding, toggleAutoAssign,
  } = useZones();

  // EVENT BUS: live-refresh on any zone/assignment/service change
  useEventRefetch(
    ['ZONE_CREATED', 'ZONE_UPDATED', 'ZONE_DELETED', 'ASSIGNMENT_UPDATED', 'SERVICE_ACTIVATED', 'BUILDING_UPDATED'],
    refetch
  );

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Automation state
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AutoAssignResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        (z.zone_name || "").toLowerCase().includes(q) ||
        (z.estates || []).some((e) => e.toLowerCase().includes(q)) ||
        (z.streets || []).some((s) => s.toLowerCase().includes(q)) ||
        (z.addresses || []).some((a) => a.toLowerCase().includes(q))
    );
  }, [zones, search]);

  const totalBuildings = zones.reduce((s, z) => s + z.building_count, 0);
  const activeZones = zones.filter((z) => z.is_active !== false).length;
  const activeServices = zones.reduce((s, z) => s + z.active_service_count, 0);

  const stats = [
    { Icon: Layers, label: "Total zones", value: zones.length, tile: "bg-emerald-50 text-emerald-600", accent: "text-emerald-700" },
    { Icon: MapPin, label: "Active zones", value: activeZones, tile: "bg-sky-50 text-sky-600", accent: "text-sky-700" },
    { Icon: Building2, label: "Buildings in zones", value: totalBuildings, tile: "bg-violet-50 text-violet-600", accent: "text-violet-700" },
    { Icon: Zap, label: "Active services", value: activeServices, tile: "bg-amber-50 text-amber-600", accent: "text-amber-700" },
  ];

  const handleView = (zone: ZoneRecord) => setSelectedZoneId(zone.id);
  const handleEdit = (zone: ZoneRecord) => setEditingZone(zone);

  const handleToggle = async (zone: ZoneRecord) => {
    setBusyId(zone.id);
    await toggleZone(zone.id, zone.is_active === false);
    setBusyId(null);
  };

  const handleDelete = async (zone: ZoneRecord) => {
    const confirmed = window.confirm(
      `Delete zone "${zone.zone_name}"? Buildings keep their service assignments but lose zone grouping.`
    );
    if (!confirmed) return;

    setBusyId(zone.id);
    await deleteZone(zone.id);
    setBusyId(null);
    if (selectedZoneId === zone.id) setSelectedZoneId(null);
  };

  const handleRunAutoAssign = async () => {
    setRunning(true);
    const result = await runAutoAssign();
    setRunning(false);
    if (result) setLastResult(result);
  };

  return (
    <div className={`${body.className} space-y-5`}>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.Icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tile}`}>
                  <Icon size={16} />
                </span>
                {!loading && i === 0 && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700"
                  >
                    <Plus size={14} />
                    New zone
                  </button>
                )}
              </div>
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-200/60" />
              ) : (
                <p className={`${display.className} text-2xl font-extrabold leading-tight tabular-nums ${s.accent}`}>
                  {s.value}
                </p>
              )}
              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-400`}>
                {s.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Automation control */}
      <ZoneAutomationCard
        enabled={autoAssignEnabled}
        running={running}
        lastResult={lastResult}
        onToggle={toggleAutoAssign}
        onRun={handleRunAutoAssign}
        onOpenReview={() => setReviewOpen(true)}
      />

      {/* Search */}
      <ZoneSearch value={search} onChange={setSearch} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Zone table */}
      {loading ? (
        <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />
      ) : (
        <ZoneTable
          zones={filteredZones}
          onView={handleView}
          onEdit={handleEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
          busyId={busyId}
        />
      )}

      {/* Overlays */}
      <ZoneDetailsDrawer zoneId={selectedZoneId} onClose={() => setSelectedZoneId(null)} />
      <CreateZoneModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={createZone}
        onMerge={mergeZone}
      />
      <EditZoneModal
        open={!!editingZone}
        zone={editingZone}
        onClose={() => setEditingZone(null)}
        onUpdate={updateZone}
      />
      <NeedsReviewDrawer
        open={reviewOpen}
        items={lastResult?.needsReview ?? []}
        zones={zones}
        onAssign={assignBuilding}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}