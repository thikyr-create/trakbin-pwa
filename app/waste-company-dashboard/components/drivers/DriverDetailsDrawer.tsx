"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Truck, TriangleAlert, Pencil, CircleCheck } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import DriverStatusBadge from "./DriverStatusBadge";
import type { DriverPageRecord, TruckOption } from "./DriversPage";

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

interface DriverDetailsDrawerProps {
  open: boolean;
  driver: DriverPageRecord | null;
  trucks?: TruckOption[];
  openIssuesCount?: number;
  onClose: () => void;
  onEdit: (driver: DriverPageRecord) => void;
}

export default function DriverDetailsDrawer({
  open,
  driver,
  trucks = [],
  openIssuesCount = 0,
  onClose,
  onEdit,
}: DriverDetailsDrawerProps) {
  const name = driver?.name || driver?.full_name || "Unknown Driver";
  const truck = trucks.find((t) => t.id === driver?.truck_id) ?? null;

  return (
    <AnimatePresence>
      {open && driver && (
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
                  <span className={`${display.className} text-2xl font-black`}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                </span>
                <div>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600`}>
                    Driver profile
                  </p>
                  <h3 className={`${display.className} text-xl font-black tracking-tight text-gray-900`}>
                    {name}
                  </h3>
                  <p className={`${mono.className} mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
                    {driver.employee_id}
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
                <DriverStatusBadge status={driver.status} />
              </motion.div>

              <motion.div variants={item} className="rounded-2xl border border-gray-100 p-5">
                <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Contact
                </p>
                <div className="space-y-3">
                  <p className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <Mail size={15} className="text-emerald-500" />
                    <span className="truncate">{driver.email}</span>
                  </p>
                  <p className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <Phone size={15} className="text-emerald-500" />
                    {driver.phone || "No phone provided"}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={item} className="rounded-2xl border border-gray-100 p-5">
                <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Assignment
                </p>
                <p className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <Truck size={15} className="text-emerald-500" />
                  {truck ? truck.label : "No truck assigned"}
                </p>
              </motion.div>

              <motion.div
                variants={item}
                className={`rounded-2xl border p-5 ${
                  openIssuesCount > 0
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-emerald-100 bg-emerald-50/60"
                }`}
              >
                <p className={`${mono.className} mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
                  Maintenance
                </p>
                {openIssuesCount > 0 ? (
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                    <TriangleAlert size={15} />
                    {openIssuesCount} open issue{openIssuesCount === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <CircleCheck size={15} />
                    No open issues
                  </p>
                )}
              </motion.div>
            </motion.div>

            {/* Footer actions */}
            <div className="border-t border-gray-100 px-6 py-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onEdit(driver)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
              >
                <Pencil size={15} />
                Edit driver
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}