"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, LayoutGrid, List } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { useBuildings } from "@/lib/features/buildings/hooks/useBuildings";
import { useBuildingFilters } from "@/lib/features/buildings/hooks/useBuildingFilters";
import BuildingStatsStrip from "./BuildingStatsStrip";
import BuildingSearch from "./BuildingSearch";
import BuildingFilters from "./BuildingFilters";
import BuildingTable from "./BuildingTable";
import BuildingCard from "./BuildingCard";
import BuildingDetailsDrawer from "./BuildingDetailsDrawer";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function BuildingsPage() {
  const { buildings, loading, error, refetch } = useBuildings();
  const {
    search,
    setSearch,
    filters,
    setFilters,
    filtered,
    counts,
    activeCount,
    reset,
  } = useBuildingFilters(buildings);

  const [view, setView] = useState<"table" | "cards">("table");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomId, setDrawerCustomId] = useState<string | null>(null);

  const openDrawer = (customId: string) => {
    setDrawerCustomId(customId);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Statistics */}
      <BuildingStatsStrip buildings={buildings} />

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <BuildingSearch value={search} onChange={setSearch} />

          <div className="flex items-center gap-3">
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>
              {filtered.length} / {buildings.length} buildings
            </p>

            <div className="flex items-center rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setView("table")}
                className={`rounded-lg p-1.5 transition ${view === "table" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                aria-label="Table view"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setView("cards")}
                className={`rounded-lg p-1.5 transition ${view === "cards" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                aria-label="Card view"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        <BuildingFilters
          filters={filters}
          onChange={setFilters}
          counts={counts}
          activeCount={activeCount}
          onReset={reset}
        />
      </div>

      {/* Content */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-200/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Building2 className="h-7 w-7 text-gray-300" />
          </div>
          <h4 className={`${display.className} text-lg font-bold text-gray-900`}>
            {buildings.length === 0 ? "No buildings registered yet" : "No buildings match"}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {buildings.length === 0
              ? "Buildings appear here once caretakers register and get approved."
              : "Try adjusting your search or filters."}
          </p>
        </motion.div>
      ) : view === "table" ? (
        <BuildingTable
          buildings={filtered}
          onSelect={(b) => openDrawer(b.custom_id)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b, i) => (
            <BuildingCard
              key={b.custom_id || b.building_id}
              building={b}
              onClick={() => openDrawer(b.custom_id)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Drawer hub */}
      <BuildingDetailsDrawer
        open={drawerOpen}
        customId={drawerCustomId}
        onClose={() => setDrawerOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}