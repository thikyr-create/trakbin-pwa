"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, UserRound, UserPlus, UserMinus, Pencil, Wrench } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import TruckStatusBadge from "./TruckStatusBadge";
import type { TruckFormDriverOption } from "./TruckForm";
import {
  assignDriver,
  unassignDriver,
  TruckEngineError,
  type TruckRecord,
} from "@/lib/core/company/truckEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

interface TruckAssignmentDrawerProps {
  open: boolean;
  truck: TruckRecord | null;
  drivers?: TruckFormDriverOption[];
  onClose: () => void;
  onSuccess: () => void; // Trigger parent refetch
  onEdit: (truck: TruckRecord) => void;
  onMaintenance: (truck: TruckRecord) => void;
}

export default function TruckAssignmentDrawer({
  open,
  truck,
  drivers = [],
  onClose,
  onSuccess,
  onEdit,
  onMaintenance,
}: TruckAssignmentDrawerProps) {
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState<"assign" | "unassign" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected("");
    setError(null);
    setSubmitting(null);
  }, [truck?.truck_id]);

  const handleAssign = async () => {
    if (!truck || !selected) return;
    setSubmitting("assign");
    setError(null);

    try {
      await assignDriver(truck.truck_id, selected);
      setSelected("");
      onSuccess();
    } catch (e) {
      setError(
        e instanceof TruckEngineError
          ? e.message
          : "Something went wrong while assigning."
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleUnassign = async () => {
    if (!truck) return;
    setSubmitting("unassign");
    setError(null);

    try {
      await unassignDriver(truck.truck_id);
      onSuccess();
    } catch (e) {
      setError(
        e instanceof TruckEngineError
          ? e.message
          : "Something went wrong while unassigning."
      );
    } finally {
      setSubmitting(null);
    }
  };

  const sortedDrivers = [...drivers].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <AnimatePresence>
      {open && truck && (
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
            className="fixed right-0 top-0 z-[910] flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Truck size={24} />
                </span>
                <div>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
                    Vehicle record
                  </p>
                  <h3 className={`${display.className} text-xl font-black tracking-tight text-gray-900`}>
                    {truck.license_plate || "No plate"}
                  </h3>
                  <p className={`${mono.className} mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
                    {truck.truck_id}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
            >
              <motion.div variants={item} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 px-5 py-4">
                <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Status
                </span>
                <TruckStatusBadge status={truck.status || "idle"} />
              </motion.div>

              <motion.div variants={item} className="rounded-2xl border border-gray-100 p-5">
                <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Specification
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>Type</p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900">{truck.truck_type || "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>Capacity</p>
                    <p className="mt-0.5 text-sm font-bold text-gray-900">{truck.capacity || "—"}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="rounded-2xl border border-gray-100 p-5">
                <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Current driver
                </p>
                {truck.driver_name ? (
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      <UserRound size={15} className="text-emerald-500" />
                      {truck.driver_name}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!!submitting}
                      onClick={handleUnassign}
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <UserMinus size={13} />
                      {submitting === "unassign" ? "..." : "Unassign"}
                    </motion.button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-400">No driver assigned</p>
                )}
              </motion.div>

              <motion.div variants={item} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700`}>
                  Assign driver
                </p>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={!!submitting}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select a driver…</option>
                  {sortedDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                      {d.helper ? ` — ${d.helper}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] font-medium text-gray-500">
                  Drivers already on another truck will be moved to this one.
                </p>

                {error && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  disabled={!selected || !!submitting}
                  onClick={handleAssign}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={15} />
                  {submitting === "assign" ? "Assigning..." : "Assign driver"}
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Footer actions */}
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onEdit(truck)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
              >
                <Pencil size={15} />
                Edit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onMaintenance(truck)}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-sm font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
              >
                <Wrench size={15} />
                Maintenance
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}