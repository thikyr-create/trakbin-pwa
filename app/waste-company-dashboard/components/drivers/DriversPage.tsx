"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Plus, Search, X, Users, LayoutGrid, List } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import { useCompanySession } from "@/lib/store/useCompanySession";
import AddDriverModal from "./AddDriverModal";
import EditDriverModal, { type EditableDriver } from "./EditDriverModal";
import DriverCard from "./DriverCard";
import DriverTable from "./DriverTable";
import DriverFilters, { DEFAULT_DRIVER_FILTERS, type DriverFilterState } from "./DriverFilters";
import DriverDetailsDrawer from "./DriverDetailsDrawer";

const supabase = supabaseBrowser;

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export interface DriverPageRecord {
  id: string;
  name: string;
  full_name?: string;
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
  onRefetch: () => void;
}

export default function DriversPage({ drivers, trucks = [], onRefetch }: DriversPageProps) {
  const { tenant } = useCompanySession();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DriverFilterState>(DEFAULT_DRIVER_FILTERS);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [openIssues, setOpenIssues] = useState<Record<string, number>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<EditableDriver | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDriverId, setDrawerDriverId] = useState<string | null>(null);

  useEffect(() => {
    const cid = tenant.companyId;
    if (!cid) return;
    supabase
      .from("driver_issues")
      .select("employee_id, status")
      .eq("company_id", cid)
      .neq("status", "resolved")
      .then(({ data }) => {
        const m: Record<string, number> = {};
        (data || []).forEach((i: any) => {
          const k = i.employee_id || "";
          m[k] = (m[k] || 0) + 1;
        });
        setOpenIssues(m);
      });
  }, [tenant.companyId]);

  const visibleDrivers = useMemo(() => {
    let list = drivers;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.name || d.full_name || "").toLowerCase().includes(q) ||
          d.employee_id.toLowerCase().includes(q) ||
          (d.email || "").toLowerCase().includes(q)
      );
    }
    if (filters.status !== "all") list = list.filter((d) => d.status === filters.status);
    if (filters.issuesOnly) list = list.filter((d) => (openIssues[d.employee_id] || 0) > 0);
    return list;
  }, [drivers, search, filters, openIssues]);

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    drivers.forEach((d) => {
      m[d.status] = (m[d.status] || 0) + 1;
    });
    return m;
  }, [drivers]);

  const driversWithIssues = useMemo(
    () => drivers.filter((d) => (openIssues[d.employee_id] || 0) > 0).length,
    [drivers, openIssues]
  );

  const drawerDriver = useMemo(
    () => drivers.find((d) => d.id === drawerDriverId) ?? null,
    [drivers, drawerDriverId]
  );

  const openDrawer = (driver: DriverPageRecord) => {
    setDrawerDriverId(driver.id);
    setDrawerOpen(true);
  };

  const startEdit = (driver: DriverPageRecord) => {
    setEditingDriver({
      id: driver.id,
      name: driver.name || driver.full_name || "",
      email: driver.email,
      phone: driver.phone,
      truck_id: driver.truck_id,
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
            placeholder="Search drivers by name or IDâ€¦"
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
            {visibleDrivers.length} / {drivers.length} drivers
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
            <Plus size={16} /> Add driver
          </motion.button>
        </div>
      </div>

      {/* Filter row */}
      <DriverFilters value={filters} onChange={setFilters} counts={statusCounts} issuesCount={driversWithIssues} />

      {/* Presentation layer */}
      {visibleDrivers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <Users className="h-7 w-7 text-gray-300" />
          </div>
          <h4 className={`${display.className} text-lg font-bold text-gray-900`}>
            {drivers.length === 0 ? "Your fleet is empty" : "No drivers match"}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {drivers.length === 0
              ? "Add your first driver to start assigning routes."
              : "Try adjusting search or filters."}
          </p>
        </motion.div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDrivers.map((driver, i) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              openIssuesCount={openIssues[driver.employee_id] || 0}
              onClick={() => openDrawer(driver)}
              index={i}
            />
          ))}
        </div>
      ) : (
        <DriverTable
          drivers={visibleDrivers}
          trucks={trucks}
          openIssues={openIssues}
          onSelect={openDrawer}
        />
      )}

      {/* Modals + drawer */}
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

      <DriverDetailsDrawer
        open={drawerOpen}
        driver={drawerDriver}
        trucks={trucks}
        openIssuesCount={drawerDriver ? openIssues[drawerDriver.employee_id] || 0 : 0}
        onClose={() => setDrawerOpen(false)}
        onEdit={startEdit}
      />
    </div>
  );
}