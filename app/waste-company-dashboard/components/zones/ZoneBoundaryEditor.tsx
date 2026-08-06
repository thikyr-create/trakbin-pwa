"use client";

import { useState } from "react";
import { Plus, Trash2, Hexagon } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

interface VertexRow {
  lat: string;
  lng: string;
}

interface ZoneBoundaryEditorProps {
  /** GeoJSON ordering: [[lng, lat], ...] */
  value: number[][] | null;
  onChange: (polygon: number[][] | null) => void;
}

export default function ZoneBoundaryEditor({ value, onChange }: ZoneBoundaryEditorProps) {
  const [rows, setRows] = useState<VertexRow[]>(() =>
    (value || []).map(([lng, lat]) => ({ lat: String(lat), lng: String(lng) }))
  );

  const sync = (next: VertexRow[]) => {
    setRows(next);

    const valid = next
      .map((r) => ({ lat: Number(r.lat), lng: Number(r.lng) }))
      .filter(
        (v) =>
          Number.isFinite(v.lat) &&
          Number.isFinite(v.lng) &&
          Math.abs(v.lat) <= 90 &&
          Math.abs(v.lng) <= 180
      )
      .map((v) => [v.lng, v.lat]); // store as [lng, lat]

    onChange(valid.length >= 3 ? valid : null);
  };

  const updateRow = (i: number, field: keyof VertexRow, val: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r));
    sync(next);
  };

  const addRow = () => {
    sync([...rows, { lat: "", lng: "" }]);
  };

  const removeRow = (i: number) => {
    sync(rows.filter((_, idx) => idx !== i));
  };

  const validCount = rows.filter((r) => {
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    return (
      r.lat.trim() !== "" &&
      r.lng.trim() !== "" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    );
  }).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500`}>
          <Hexagon size={12} />
          Zone boundary polygon
        </p>
        <span className={`${mono.className} rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
          validCount >= 3
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-gray-100 text-gray-400 ring-gray-200"
        }`}>
          {validCount} vertex{validCount === 1 ? "" : "es"} {validCount >= 3 ? "· active" : "· need 3+"}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mb-3 text-[11px] font-medium text-gray-400">
          No polygon defined — the engine falls back to radius and text matching for this zone.
          Add at least 3 vertices to enable boundary-based assignment.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`${mono.className} w-6 shrink-0 text-center text-[10px] font-bold text-gray-400`}>
                {i + 1}
              </span>
              <input
                type="text"
                value={row.lat}
                onChange={(e) => updateRow(i, "lat", e.target.value)}
                placeholder="Latitude (e.g. 4.8156)"
                className={inputCls}
              />
              <input
                type="text"
                value={row.lng}
                onChange={(e) => updateRow(i, "lng", e.target.value)}
                placeholder="Longitude (e.g. 7.0498)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-gray-600 ring-1 ring-gray-200 transition hover:bg-gray-50"
      >
        <Plus size={13} />
        Add vertex
      </button>
    </div>
  );
}