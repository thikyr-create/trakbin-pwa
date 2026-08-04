"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Truck } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import TruckForm, { type TruckFormValues, type TruckFormDriverOption } from "./TruckForm";
import { createTruck, TruckEngineError, type TruckRecord } from "@/lib/core/company/truckEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger parent refetch
  drivers?: TruckFormDriverOption[];
}

type ModalState =
  | { status: "form" }
  | { status: "success"; truck: TruckRecord };

export default function AddTruckModal({
  isOpen,
  onClose,
  onSuccess,
  drivers = [],
}: AddTruckModalProps) {
  const [state, setState] = useState<ModalState>({ status: "form" });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setState({ status: "form" });
    setSubmitting(false);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (values: TruckFormValues) => {
    setSubmitting(true);
    try {
      const truck = await createTruck(values);

      onSuccess();

      setState({ status: "success", truck });
    } catch (error) {
      setSubmitting(false);
      if (error instanceof TruckEngineError) {
        throw error; // Let TruckForm handle the UI error display
      }
      throw new Error("An unexpected error occurred.");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                  {state.status === "form" ? "Register Truck" : "Truck Registered"}
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
            <div className="p-6">
              {state.status === "form" ? (
                <TruckForm
                  mode="create"
                  drivers={drivers}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                    <p className="text-sm font-semibold text-emerald-900">
                      {state.truck.license_plate} has been added to your fleet.
                    </p>
                  </div>

                  <div>
                    <p className={`${mono.className} mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
                      Truck ID
                    </p>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                      <span className="flex items-center gap-2 font-mono text-sm font-bold text-gray-900">
                        <Truck size={14} className="text-emerald-600" />
                        {state.truck.truck_id}
                      </span>
                      <button
                        onClick={() => handleCopy(state.truck.truck_id)}
                        className="text-gray-400 hover:text-emerald-600"
                      >
                        {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {state.truck.driver_name ? (
                    <p className="text-xs font-semibold text-gray-500">
                      Assigned driver: <span className="text-gray-800">{state.truck.driver_name}</span>
                    </p>
                  ) : null}

                  <button
                    onClick={handleClose}
                    className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}