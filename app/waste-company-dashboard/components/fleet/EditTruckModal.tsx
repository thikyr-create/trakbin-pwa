"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import TruckForm, { type TruckFormValues, type TruckFormDriverOption } from "./TruckForm";
import { updateTruck, TruckEngineError } from "@/lib/core/company/truckEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export interface EditableTruck {
  truck_id: string;
  license_plate: string;
  truck_type?: string | null;
  capacity?: string | null;
  status?: string;
  current_driver?: string | null;
}

interface EditTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger parent refetch
  truck: EditableTruck | null;
  drivers?: TruckFormDriverOption[];
}

export default function EditTruckModal({
  isOpen,
  onClose,
  onSuccess,
  truck,
  drivers = [],
}: EditTruckModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (values: TruckFormValues) => {
    if (!truck) return;
    setSubmitting(true);

    try {
      await updateTruck(truck.truck_id, values);

      onSuccess();
      handleClose();
    } catch (error) {
      setSubmitting(false);
      if (error instanceof TruckEngineError) {
        throw error; // Let TruckForm handle the UI error display
      }
      throw new Error("An unexpected error occurred while updating.");
    }
  };

  if (!truck) return null;

  const defaultValues: TruckFormValues = {
    license_plate: truck.license_plate || "",
    truck_type: truck.truck_type || "Compactor",
    capacity: truck.capacity || "",
    status: truck.status || "active",
    driver_employee_id: truck.current_driver || null,
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
                  Edit Truck
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
              <TruckForm
                mode="edit"
                defaultValues={defaultValues}
                drivers={drivers}
                submitting={submitting}
                onSubmit={handleSubmit}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}