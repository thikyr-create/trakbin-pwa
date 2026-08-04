"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import TruckStatusBadge from "./TruckStatusBadge";
import { setTruckStatus, TruckEngineError, type TruckRecord } from "@/lib/core/company/truckEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface TruckMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger parent refetch
  truck: TruckRecord | null;
}

type TargetStatus = "maintenance" | "active";

export default function TruckMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  truck,
}: TruckMaintenanceModalProps) {
  const [submitting, setSubmitting] = useState<TargetStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ack, setAck] = useState(false);

  const handleClose = () => {
    setSubmitting(null);
    setError(null);
    setAck(false);
    onClose();
  };

  const apply = async (status: TargetStatus) => {
    if (!truck) return;
    setSubmitting(status);
    setError(null);

    try {
      await setTruckStatus(truck.truck_id, status);
      onSuccess();
      handleClose();
    } catch (e) {
      setError(
        e instanceof TruckEngineError
          ? e.message
          : "Something went wrong while updating status."
      );
      setSubmitting(null);
    }
  };

  const onRoute = truck?.status === "on_route";
  const inMaintenance = truck?.status === "maintenance";
  const maintenanceBlocked = onRoute && !ack;

  return (
    <AnimatePresence>
      {isOpen && truck && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl shadow-emerald-900/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
                  Fleet Management
                </p>
                <h3 className={`${display.className} text-xl font-black tracking-tight text-gray-900`}>
                  Maintenance
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/60 px-5 py-4">
                <div>
                  <p className={`${display.className} text-sm font-black text-gray-900`}>
                    {truck.license_plate}
                  </p>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-400`}>
                    {truck.truck_id}
                  </p>
                </div>
                <TruckStatusBadge status={truck.status || "idle"} />
              </div>

              {onRoute && (
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-800">
                      This truck is currently on a route. Pulling it for maintenance will disrupt active collections.
                    </p>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={ack}
                        onChange={(e) => setAck(e.target.checked)}
                        className="h-3.5 w-3.5 accent-amber-600"
                      />
                      I understand — pull it anyway
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {!inMaintenance ? (
                  <motion.button
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    disabled={!!submitting || maintenanceBlocked}
                    onClick={() => apply("maintenance")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wrench size={15} />
                    {submitting === "maintenance" ? "Updating..." : "Send to maintenance"}
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    disabled={!!submitting}
                    onClick={() => apply("active")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    {submitting === "active" ? "Updating..." : "Return to service"}
                  </motion.button>
                )}

                <button
                  onClick={handleClose}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-gray-500 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}