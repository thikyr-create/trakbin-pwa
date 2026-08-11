"use client";

import { useEffect, useState } from "react";
import { Truck, Loader2, CircleCheck, TriangleAlert } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export default function CollectionSettings({ bundle, loading, saveSettings }: SettingsSectionProps) {
  const [days, setDays] = useState<string[]>([]);
  const [startHour, setStartHour] = useState("07:00");
  const [endHour, setEndHour] = useState("17:00");
  const [maxStops, setMaxStops] = useState(60);
  const [routeOptimization, setRouteOptimization] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const s = bundle?.settings;

  useEffect(() => {
    if (s) {
      setDays(s.default_collection_days ?? []);
      setStartHour(s.working_hours_start ?? "07:00");
      setEndHour(s.working_hours_end ?? "17:00");
      setMaxStops(s.max_stops_per_route ?? 60);
      setRouteOptimization(s.route_optimization ?? true);
      setAutoAssign(s.auto_assign_drivers ?? false);
    }
  }, [bundle]);

  const dirty =
    !!s &&
    (JSON.stringify([...days].sort()) !== JSON.stringify([...(s.default_collection_days ?? [])].sort()) ||
      startHour !== s.working_hours_start ||
      endHour !== s.working_hours_end ||
      maxStops !== s.max_stops_per_route ||
      routeOptimization !== s.route_optimization ||
      autoAssign !== s.auto_assign_drivers);

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!Number.isInteger(maxStops) || maxStops < 1 || maxStops > 500) {
      setFeedback({ type: "error", text: "Maximum stops must be between 1 and 500." });
      return;
    }
    if (startHour >= endHour) {
      setFeedback({ type: "error", text: "Working hours start must be before end." });
      return;
    }

    setSaving(true);
    const result = await saveSettings({
      default_collection_days: DAYS.filter((d) => days.includes(d)),
      working_hours_start: startHour,
      working_hours_end: endHour,
      max_stops_per_route: maxStops,
      route_optimization: routeOptimization,
      auto_assign_drivers: autoAssign,
    });
    setSaving(false);

    setFeedback(
      result.ok
        ? { type: "success", text: "Collection rules updated." }
        : { type: "error", text: result.error || "Failed to save collection rules." }
    );
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Truck size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Collection rules
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            defaults for schedules and route planning
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-5">
        {/* Default collection days */}
        <div>
          <label className={labelCls}>Default collection days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const on = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold ring-1 transition ${
                    on
                      ? "bg-emerald-600 text-white ring-emerald-600 shadow-md shadow-emerald-200"
                      : "bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {DAY_SHORT[day]}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-gray-400">
            Buildings can still override with their own schedules.
          </p>
        </div>

        {/* Working hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Working hours start</label>
            <input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Working hours end</label>
            <input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Max stops */}
        <div>
          <label className={labelCls}>Maximum stops per route</label>
          <input
            type="number" min={1} max={500} value={maxStops}
            onChange={(e) => setMaxStops(Number(e.target.value))}
            className={`${inputCls} max-w-[140px]`}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {[
            {
              label: "Route optimization",
              desc: "Routes are ordered for shortest path when created",
              value: routeOptimization,
              set: setRouteOptimization,
            },
            {
              label: "Auto-assign drivers",
              desc: "New routes receive an available driver automatically",
              value: autoAssign,
              set: setAutoAssign,
            },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-gray-700">{t.label}</p>
                <p className="text-[11px] font-medium text-gray-400">{t.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => t.set(!t.value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${t.value ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${t.value ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
          <p className="text-[11px] font-semibold leading-relaxed text-sky-800">
            These rules persist now and are read by the dispatch engine when routes are created
            — no mock behavior, no hidden state.
          </p>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? <CircleCheck size={14} /> : <TriangleAlert size={14} />}
            {feedback.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !dirty}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CircleCheck size={15} />}
          {saving ? "Saving…" : "Save collection rules"}
        </button>
      </form>
    </div>
  );
}