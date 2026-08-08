"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2, AlertTriangle, GitMerge } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

const splitList = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export interface ZonePayload {
  zone_name: string;
  center_lat?: number | null;
  center_lng?: number | null;
  radius_km?: number | null;
  estates?: string[];
  streets?: string[];
  addresses?: string[];
}

interface CreateZoneModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: ZonePayload) => Promise<{
    ok: boolean;
    error?: string;
    duplicate?: { zoneId: string; zoneName: string };
  }>;
  onMerge?: (zoneId: string, payload: ZonePayload) => Promise<{ ok: boolean; error?: string }>;
}

export default function CreateZoneModal({ open, onClose, onCreate, onMerge }: CreateZoneModalProps) {
  const [zoneName, setZoneName] = useState("");
  const [centerLat, setCenterLat] = useState("");
  const [centerLng, setCenterLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [estates, setEstates] = useState("");
  const [streets, setStreets] = useState("");
  const [addresses, setAddresses] = useState("");
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ zoneId: string; zoneName: string } | null>(null);

  const reset = () => {
    setZoneName("");
    setCenterLat("");
    setCenterLng("");
    setRadiusKm("");
    setEstates("");
    setStreets("");
    setAddresses("");
    setError(null);
    setDuplicate(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const buildPayload = (): ZonePayload => {
    const lat = centerLat.trim() === "" ? null : Number(centerLat);
    const lng = centerLng.trim() === "" ? null : Number(centerLng);
    const radius = radiusKm.trim() === "" ? null : Number(radiusKm);
    return {
      zone_name: zoneName.trim(),
      center_lat: lat,
      center_lng: lng,
      radius_km: radius,
      estates: splitList(estates),
      streets: splitList(streets),
      addresses: splitList(addresses),
    };
  };

  const validate = (): string | null => {
    const p = buildPayload();
        if (p.center_lat != null && (!Number.isFinite(p.center_lat) || p.center_lat < -90 || p.center_lat > 90))
      return "Latitude must be a number between -90 and 90.";
    if (p.center_lng != null && (!Number.isFinite(p.center_lng) || p.center_lng < -180 || p.center_lng > 180))
      return "Longitude must be a number between -180 and 180.";
    if (p.radius_km != null && (!Number.isFinite(p.radius_km) || p.radius_km <= 0))
      return "Radius must be a positive number (km).";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const result = await onCreate(buildPayload());
    setSaving(false);

    if (!result.ok) {
      // Duplicate detected → show merge confirmation instead of an error
      if (result.error === 'zone_name_exists' && result.duplicate) {
        setDuplicate(result.duplicate);
        return;
      }
      setError(result.error || "Failed to create zone.");
      return;
    }

    close();
  };

  const mergeIntoExisting = async () => {
    if (!duplicate || !onMerge) return;
    setMerging(true);
    setError(null);
    const r = await onMerge(duplicate.zoneId, buildPayload());
    setMerging(false);
    if (!r.ok) {
      setError(r.error || "Could not merge into the existing zone.");
      setDuplicate(null);
      return;
    }
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[940] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-[950] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <MapPin size={18} />
                </span>
                <div>
                  <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>
                    Create zone
                  </h2>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>
                    service area definition
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {duplicate ? (
              /* ── Duplicate confirmation ── */
              <div className="space-y-4 px-6 py-5">
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <GitMerge size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      “{duplicate.zoneName}” already exists.
                    </p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700">
                      A zone with this name already houses its own buildings. You can add the
                      estates, streets and addresses you entered to the existing zone instead of
                      creating a duplicate.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-xs font-semibold text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDuplicate(null)}
                    className="flex-1 rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100"
                  >
                    Go back
                  </button>
                  <button
                    type="button"
                    onClick={mergeIntoExisting}
                    disabled={merging}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-amber-200 transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {merging ? <Loader2 size={15} className="animate-spin" /> : <GitMerge size={15} />}
                    {merging ? "Merging…" : "Add to existing zone"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal create form ── */
              <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
                <div>
                  <label className={labelCls}>Zone name *</label>
                  <input
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="e.g. Zone A — NTA Estate"
                    className={inputCls}
                  />
                  <p className="mt-1 text-[10px] font-medium text-gray-400">
                    Buildings whose service assignment references this exact name will belong to the zone.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Center lat</label>
                    <input
                      type="text"
                      value={centerLat}
                      onChange={(e) => setCenterLat(e.target.value)}
                      placeholder="4.8156"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Center lng</label>
                    <input
                      type="text"
                      value={centerLng}
                      onChange={(e) => setCenterLng(e.target.value)}
                      placeholder="7.0498"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Radius (km)</label>
                    <input
                      type="text"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                      placeholder="2.5"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Estates (comma-separated)</label>
                  <input
                    type="text"
                    value={estates}
                    onChange={(e) => setEstates(e.target.value)}
                    placeholder="NTA Estate, Choba Gardens"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Streets (comma-separated)</label>
                  <input
                    type="text"
                    value={streets}
                    onChange={(e) => setStreets(e.target.value)}
                    placeholder="Wok Road, East-West Road"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Addresses (comma-separated)</label>
                  <input
                    type="text"
                    value={addresses}
                    onChange={(e) => setAddresses(e.target.value)}
                    placeholder="12 Wok Road, 45 Choba"
                    className={inputCls}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-xs font-semibold text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                    {saving ? "Creating…" : "Create zone"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}