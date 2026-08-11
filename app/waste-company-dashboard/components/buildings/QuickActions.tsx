"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, TriangleAlert, Zap } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import {
  updateSchedule,
  toggleAutopay,
  reportIssue,
  BuildingEngineError,
} from "@/lib/core/building/BuildingEngine";
import {
  validateSchedule,
  validateIssueReport,
  ISSUE_TYPES,
  SEVERITIES,
  TIME_WINDOWS,
} from "@/lib/features/buildings/validation/buildingValidation";
import { WEEKDAYS } from "@/lib/features/buildings/utils/buildingHelpers";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface QuickActionsProps {
  customId: string;
  pickupDays?: string[] | null;
  timeWindow?: string | null;
  autopayEnabled?: boolean | null;
  onSuccess: () => void;
}

type Panel = null | "schedule" | "issue";

export default function QuickActions({
  customId,
  pickupDays,
  timeWindow,
  autopayEnabled,
  onSuccess,
}: QuickActionsProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Schedule state
  const [days, setDays] = useState<string[]>(pickupDays || []);
  const [window, setWindow] = useState<string>(timeWindow || "");

  // Issue state
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");

  const clearFlags = () => {
    setError(null);
    setNotice(null);
  };

  const openPanel = (p: Panel) => {
    clearFlags();
    setPanel((cur) => (cur === p ? null : p));
  };

  const toggleDay = (d: string) => {
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
    setError(null);
  };

  const handleSaveSchedule = async () => {
    clearFlags();
    const errs = validateSchedule({ pickup_days: days, time_window: window || null });
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return;
    }

    setBusy("schedule");
    try {
      await updateSchedule({
        custom_id: customId,
        pickup_days: days,
        time_window: window || null,
      });
      setNotice("Schedule updated.");
      setPanel(null);
      onSuccess();
    } catch (e) {
      setError(e instanceof BuildingEngineError ? e.message : "Failed to update schedule.");
    } finally {
      setBusy(null);
    }
  };

  const handleToggleAutopay = async () => {
    clearFlags();
    setBusy("autopay");
    try {
      await toggleAutopay({ custom_id: customId, enabled: !autopayEnabled });
      setNotice(`Autopay ${!autopayEnabled ? "enabled" : "disabled"}.`);
      onSuccess();
    } catch (e) {
      setError(e instanceof BuildingEngineError ? e.message : "Failed to toggle autopay.");
    } finally {
      setBusy(null);
    }
  };

  const handleReportIssue = async () => {
    clearFlags();
    const errs = validateIssueReport({ issue_type: issueType, description });
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return;
    }

    setBusy("issue");
    try {
      await reportIssue({
        custom_id: customId,
        issue_type: issueType,
        severity,
        description: description || undefined,
      });
      setNotice("Issue reported.");
      setPanel(null);
      setIssueType("");
      setDescription("");
      onSuccess();
    } catch (e) {
      setError(e instanceof BuildingEngineError ? e.message : "Failed to report issue.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <p className={`${mono.className} mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500`}>
        Quick actions
      </p>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
          {notice}
        </div>
      )}

      {/* Autopay row */}
      <div className="mb-3 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-emerald-500" />
          <div>
            <p className="text-xs font-bold text-gray-800">Autopay</p>
            <p className="text-[10px] font-medium text-gray-400">
              {autopayEnabled ? "Billing is automatic" : "Manual billing"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleAutopay}
          disabled={busy === "autopay"}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
            autopayEnabled ? "bg-emerald-500" : "bg-gray-300"
          }`}
          aria-label="Toggle autopay"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              autopayEnabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openPanel("schedule")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            panel === "schedule"
              ? "bg-emerald-600 text-white"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <CalendarDays size={14} /> Change schedule
        </button>
        <button
          onClick={() => openPanel("issue")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            panel === "issue"
              ? "bg-amber-500 text-white"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <TriangleAlert size={14} /> Report issue
        </button>
      </div>

      <AnimatePresence mode="wait">
        {panel === "schedule" && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-gray-400`}>
                Pickup days
              </p>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => {
                  const active = days.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-emerald-300"
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <select
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-400"
              >
                <option value="">No time window</option>
                {TIME_WINDOWS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveSchedule}
                disabled={busy === "schedule"}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === "schedule" ? "Saving..." : "Save schedule"}
              </button>
            </div>
          </motion.div>
        )}

        {panel === "issue" && (
          <motion.div
            key="issue"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-400"
              >
                <option value="">Select issue type…</option>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none focus:border-emerald-400"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    Severity: {s}
                  </option>
                ))}
              </select>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 outline-none placeholder:text-gray-400 focus:border-emerald-400"
              />

              <button
                onClick={handleReportIssue}
                disabled={busy === "issue"}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {busy === "issue" ? "Reporting..." : "Report issue"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}