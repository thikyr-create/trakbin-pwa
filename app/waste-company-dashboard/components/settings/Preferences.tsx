"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { SettingsSectionProps } from "./settingsConfig";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

const TIMEZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Europe/London", "UTC"];

export default function Preferences({ bundle, loading, saveSettings }: SettingsSectionProps) {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [dateFormat, setDateFormat] = useState("DD MMM YYYY");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [mapStyle, setMapStyle] = useState("satellite");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const s = bundle?.settings;

  useEffect(() => {
    if (s) {
      setTheme(s.theme ?? "light");
      setLanguage(s.language ?? "en");
      setTimezone(s.timezone ?? "Africa/Lagos");
      setDateFormat(s.date_format ?? "DD MMM YYYY");
      setDistanceUnit(s.distance_unit ?? "km");
      setMapStyle(s.map_style ?? "satellite");
    }
  }, [bundle]);

  const dirty =
    !!s &&
    (theme !== s.theme || language !== s.language || timezone !== s.timezone ||
      dateFormat !== s.date_format || distanceUnit !== s.distance_unit || mapStyle !== s.map_style);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    const result = await saveSettings({
      theme,
      language,
      timezone,
      date_format: dateFormat,
      distance_unit: distanceUnit,
      map_style: mapStyle,
    });

    setSaving(false);
    setFeedback(
      result.ok
        ? { type: "success", text: "Preferences saved." }
        : { type: "error", text: result.error || "Failed to save preferences." }
    );
  };

  if (loading && !bundle) {
    return <div className="h-64 animate-pulse rounded-[24px] bg-gray-200/60" />;
  }

  return (
    <div className="rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <SlidersHorizontal size={18} />
        </span>
        <div>
          <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
            Preferences
          </h2>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
            display and locale defaults
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className={inputCls}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Time zone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date format</label>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className={inputCls}>
              <option value="DD MMM YYYY">DD MMM YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Distance unit</label>
            <select value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value)} className={inputCls}>
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Map style</label>
            <select value={mapStyle} onChange={(e) => setMapStyle(e.target.value)} className={inputCls}>
              <option value="satellite">Satellite</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
          <p className="text-[11px] font-semibold leading-relaxed text-sky-800">
            Preferences persist now. Theme switching and map-style rendering activate when the
            design-polish phase ships — settings are never lost in the meantime.
          </p>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {feedback.text}
          </div>
        )}

        <button type="submit" disabled={saving || !dirty}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}