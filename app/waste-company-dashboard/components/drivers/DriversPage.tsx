"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, X, Users } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import AddDriverModal from "./AddDriverModal";
import EditDriverModal, { type EditableDriver } from "./EditDriverModal";
import DriverCard from "./DriverCard";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export interface DriverPageRecord {
  id: string;
  name: string;
  full_name?: string; // Fallback for legacy data
  email: string;
  phone?: string | null;
  employee_id: string;
  truck_id?: string | null;
  status: string;
}

export interface TruckOption {
  id: string;
  label: string;
  helper?: string;
}

interface DriversPageProps {
  drivers: DriverPageRecord[];
  trucks?: TruckOption[];
  openIssues?: Record<string, number>;
  onRefetch: () => void;
}

export default function DriversPage({
  drivers,
  trucks = [],
  openIssues = {},
  onRefetch,
}: DriversPageProps) {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<EditableDriver | null>(null);

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        (d.name || d.full_name || "").toLowerCase().includes(q) ||
        d.employee_id.toLowerCase().includes(q) ||
        (d.email || "").toLowerCase().includes(q)
    );
  }, [drivers, search]);

  const handleSelectDriver = (driver: DriverPageRecord) => {
    setEditingDriver({
      id: driver.id,
      name: driver.name || driver.full_name || "",
      email: driver.email,
      phone: driver.phone,
      truck_id: driver.truck_id,
    });
  };

  return (
    <div className="space-y-6">
      {/* Orchestration Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search drivers by name or ID…"
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
        
        <div className="flex items-center gap-4">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-500`}>
            {filteredDrivers.length} {filteredDrivers.length === 1 ? "driver" : "drivers"}
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <Plus size={16} /> Add driver
          </motion.button>
        </div>
      </div>

      {/* Presentation Layer */}
      {filteredDrivers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Users className="h-7 w-7 text-gray-300" />
          </div>
          <h4 className={`${display.className} text-lg font-bold text-gray-900`}>
            {search ? "No drivers match your search" : "Your fleet is empty"}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {search ? "Try adjusting your keywords." : "Add your first driver to start assigning routes."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDrivers.map((driver, i) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              openIssuesCount={openIssues[driver.employee_id] || 0}
              onClick={() => handleSelectDriver(driver)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddDriverModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={onRefetch}
        trucks={trucks}
      />

      <EditDriverModal
        isOpen={!!editingDriver}
        onClose={() => setEditingDriver(null)}
        onSuccess={onRefetch}
        driver={editingDriver}
        trucks={trucks}
      />
    </div>
  );
}