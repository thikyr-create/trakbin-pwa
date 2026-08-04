"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, X, Truck, LayoutGrid, List } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import AddTruckModal from "./AddTruckModal";
import EditTruckModal, { type EditableTruck } from "./EditTruckModal";
import TruckCard from "./TruckCard";
import FleetTable from "./FleetTable";
import TruckAssignmentDrawer from "./TruckAssignmentDrawer";
import TruckMaintenanceModal from "./TruckMaintenanceModal";
import type { TruckFormDriverOption } from "./TruckForm";
import type { TruckRecord } from "@/lib/core/company/truckEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface FleetPageProps {
  trucks: TruckRecord[];
  drivers?: TruckFormDriverOption[];
  onRefetch: () => void;
}

export default function FleetPage({ trucks, drivers = [], onRefetch }: FleetPageProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<EditableTruck | null>(null);
  const [maintenanceTruck, setMaintenanceTruck] = useState<TruckRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTruckId, setDrawerTruckId] = useState<string | null>(null);

  const visibleTrucks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trucks;
    return trucks.filter(
      (t) =>
        (t.truck_id || "").toLowerCase().includes(q) ||
        (t.license_plate || "").toLowerCase().includes(q) ||
        (t.driver_name || "").toLowerCase().includes(q)
    );
  }, [trucks, search]);

  const drawerTruck = useMemo(
    () => trucks.find((t) => t.truck_id === drawerTruckId) ?? null,
    [trucks, drawerTruckId]
  );

  const openDrawer = (truck: TruckRecord) => {
    setDrawerTruckId(truck.truck_id);
    setDrawerOpen(true);
  };

  const startEdit = (truck: TruckRecord) => {
    setEditingTruck({
      truck_id: truck.truck_id,
      license_plate: truck.license_plate,
      truck_type: truck.truck_type,
      capacity: truck.capacity,
      status: truck.status,
      current_driver: truck.current_driver,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search trucks by ID, plate or driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-800"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>
            {visibleTrucks.length} / {trucks.length} trucks
          </p>

          <div className="flex items-center rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setView("grid")}
              className={`rounded-lg p-1.5 transition ${view === "grid" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="Card view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`rounded-lg p-1.5 transition ${view === "table" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="Table view"
            >
              <List size={15} />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <Plus size={16} /> Add truck
          </motion.button>
        </div>
      </div>

      {/* Presentation layer */}
      {visibleTrucks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Truck className="h-7 w-7 text-gray-300" />
          </div>
          <h4 className={`${display.className} text-lg font-bold text-gray-900`}>
            {trucks.length === 0 ? "Your fleet is empty" : "No trucks match"}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {trucks.length === 0
              ? "Register your first truck to start running routes."
              : "Try adjusting your search."}
          </p>
        </motion.div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTrucks.map((truck, i) => (
            <TruckCard
              key={truck.truck_id}
              truck={truck}
              onClick={() => openDrawer(truck)}
              index={i}
            />
          ))}
        </div>
      ) : (
        <FleetTable trucks={visibleTrucks} onSelect={openDrawer} />
      )}

      {/* Modals + drawer */}
      <AddTruckModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={onRefetch}
        drivers={drivers}
      />

      <EditTruckModal
        isOpen={!!editingTruck}
        onClose={() => setEditingTruck(null)}
        onSuccess={onRefetch}
        truck={editingTruck}
        drivers={drivers}
      />

      <TruckMaintenanceModal
        isOpen={!!maintenanceTruck}
        onClose={() => setMaintenanceTruck(null)}
        onSuccess={onRefetch}
        truck={maintenanceTruck}
      />

      <TruckAssignmentDrawer
        open={drawerOpen}
        truck={drawerTruck}
        drivers={drivers}
        onClose={() => setDrawerOpen(false)}
        onSuccess={onRefetch}
        onEdit={startEdit}
        onMaintenance={(truck) => setMaintenanceTruck(truck)}
      />
    </div>
  );
}