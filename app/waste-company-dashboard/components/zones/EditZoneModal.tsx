"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Loader2, AlertTriangle, Info, Lock } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { ZoneRecord } from "@/lib/features/zones/services/zoneService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";
const labelCls = `${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`;

const splitList = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

interface EditZoneModalProps {
  open: boolean;
  zone: ZoneRecord | null;
  onClose: () => void;
  onUpdate: (zoneId: string, payload: {
    center_lat?: number | null;
    center_lng?: number | null;
    radius_km?: number | null;
    is_active?: boolean;
    estates?: string[];
    streets?: string[];
    addresses?: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
}

export default function EditZoneModal({ open, zone, onClose, onUpdate }: EditZoneModalProps) {
  const [centerLat, setCenterLat] = useState("");
  const [centerLng, setCenterLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [estates, setEstates] = useState("");
  const [streets, setStreets] = useState("");
  const [addresses, setAddresses] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (zone && open) {
      setCenterLat(zone.center_lat != null ? String(zone.center_lat) : "");
      setCenterLng(zone.center_lng != null ? String(zone.center_lng) : "");
      setRadiusKm(zone.radius_km != null ? String(zone.radius_km) : "");
      setEstates((zone.estates || []).join(", "));
      setStreets((zone.streets || []).join(", "));
      setAddresses((zone.addresses || []).join(", "));
      setIsActive(zone.is_active !== false);
      setError(null);
    }
  }, [zone, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;
    setError(null);

    const lat = centerLat.trim() === "" ? null : Number(centerLat);
    const lng = centerLng.trim() === "" ? null : Number(centerLng);
    const radius = radiusKm.trim() === "" ? null : Number(radiusKm);

    if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
      setError("Latitude must be a number between -90 and 90."); return;
    }
    if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
      setError("Longitude must be a number between -180 and 180."); return;
    }
    if (radius !== null && (!Number.isFinite(radius) || radius <= 0)) {
      setError("Radius must be a positive number (km)."); return;
    }

    setSaving(true);
    const result = await onUpdate(zone.id, {
      center_lat: lat,
      center_lng: lng,
      radius_km: radius,
      is_active: isActive,
      estates: splitList(estates),
      streets: splitList(streets),
      addresses: splitList(addresses),
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error || "Failed to update zone.");
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && zone && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[940] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 z-[950] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <Pencil size={18} />
                </span>
                <div>
                  <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Edit zone</h2>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>service area definition</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}>Zone name <Lock size={10} /></label>
                <input type="text" value={zone.zone_name} disabled className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500 cursor-not-allowed" />
                <p className="mt-1.5 flex items-start gap-1.5 text-[10px] font-medium text-amber-600">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  Name is locked because buildings use it to map to this zone. Changing it would disconnect existing service assignments.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Center lat</label>
                  <input type="text" value={centerLat} onChange={(e) => setCenterLat(e.target.value)} placeholder="4.8156" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Center lng</label>
                  <input type="text" value={centerLng} onChange={(e) => setCenterLng(e.target.value)} placeholder="7.0498" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Radius (km)</label>
                  <input type="text" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} placeholder="2.5" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Estates (comma-separated)</label>
                <input type="text" value={estates} onChange={(e) => setEstates(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Streets (comma-separated)</label>
                <input type="text" value={streets} onChange={(e) => setStreets(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Addresses (comma-separated)</label>
                <input type="text" value={addresses} onChange={(e) => setAddresses(e.target.value)} className={inputCls} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm font-bold text-gray-700">Zone active?</span>
                <button type="button" onClick={() => setIsActive(!isActive)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "left-6" : "left-1"}`} />
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
                  <p className="text-xs font-semibold text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 disabled:opacity-50">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}