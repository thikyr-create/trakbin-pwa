"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import DriverForm, { type DriverFormValues } from "./DriverForm";
import { DriverEngineError } from "@/lib/core/company/driverEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export interface EditableDriver {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  truck_id?: string | null;
}

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger parent refetch
  driver: EditableDriver | null;
  trucks?: { id: string; label: string; helper?: string }[];
}

export default function EditDriverModal({
  isOpen,
  onClose,
  onSuccess,
  driver,
  trucks = [],
}: EditDriverModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (values: DriverFormValues) => {
    if (!driver) return;
    setSubmitting(true);
    
    try {
      const res = await fetch(`/api/company/drivers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: driver.id,
          ...values,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new DriverEngineError(
          data?.error || "Failed to update driver.",
          res.status
        );
      }

      onSuccess();
      handleClose();
    } catch (error) {
      setSubmitting(false);
      if (error instanceof DriverEngineError) {
        throw error; // Let DriverForm handle the UI error display
      }
      throw new Error("An unexpected error occurred while updating.");
    }
  };

  if (!driver) return null;

  const defaultValues: DriverFormValues = {
    name: driver.name,
    email: driver.email,
    phone: driver.phone || "",
    truck_id: driver.truck_id || null,
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
                  Edit Driver
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
              <DriverForm
                mode="edit"
                defaultValues={defaultValues}
                trucks={trucks}
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