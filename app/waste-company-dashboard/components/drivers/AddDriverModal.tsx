"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, MailWarning } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import DriverForm, { type DriverFormValues } from "./DriverForm";
import { createDriver, type DriverCredentials, DriverEngineError } from "@/lib/core/company/driverEngine";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger parent refetch
  trucks?: { id: string; label: string; helper?: string }[];
}

type ModalState = 
  | { status: "form" }
  | { status: "success"; credentials: DriverCredentials; emailSent: boolean; driverName: string };

export default function AddDriverModal({ isOpen, onClose, onSuccess, trucks = [] }: AddDriverModalProps) {
  const [state, setState] = useState<ModalState>({ status: "form" });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setState({ status: "form" });
    setSubmitting(false);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (values: DriverFormValues) => {
    setSubmitting(true);
    try {
      const result = await createDriver(values);
      
      // Trigger parent refetch immediately
      onSuccess();

      // Transition to success state to show credentials
      setState({
        status: "success",
        credentials: result.credentials,
        emailSent: result.emailSent,
        driverName: values.name,
      });
    } catch (error) {
      setSubmitting(false);
      if (error instanceof DriverEngineError) {
        throw error; // Let DriverForm handle the UI error display
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
                  {state.status === "form" ? "Add New Driver" : "Driver Provisioned"}
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
                <DriverForm
                  mode="create"
                  trucks={trucks}
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
                      {state.driverName} has been successfully added to your fleet.
                    </p>
                  </div>

                  {!state.emailSent && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                      <MailWarning size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <p className="text-xs font-medium text-amber-800">
                        Email delivery is not configured. Please share these credentials manually.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className={`${mono.className} mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
                        Employee ID
                      </p>
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {state.credentials.employeeId}
                        </span>
                        <button
                          onClick={() => handleCopy(state.credentials.employeeId)}
                          className="text-gray-400 hover:text-emerald-600"
                        >
                          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className={`${mono.className} mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
                        Temporary Password
                      </p>
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {state.credentials.tempPassword}
                        </span>
                        <button
                          onClick={() => handleCopy(state.credentials.tempPassword)}
                          className="text-gray-400 hover:text-emerald-600"
                        >
                          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

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