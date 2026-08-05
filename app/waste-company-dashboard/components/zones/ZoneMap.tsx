"use client";

import { MapPin, ExternalLink } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";
import type { ZoneRecord, ZoneBuildingRow } from "@/lib/features/zones/services/zoneService";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const KM_PER_LAT = 110.574;
const W = 600;
const H = 320;
const CX = W / 2;
const CY = H / 2;

interface ZoneMapProps {
  zone: ZoneRecord;
  buildings: ZoneBuildingRow[];
}

function toXY(
  lat: number, lng: number, cLat: number, cLng: number, pxPerKm: number
): { x: number; y: number } {
  const kmPerLng = 111.32 * Math.cos((cLat * Math.PI) / 180) || 1;
  return {
    x: CX + (lng - cLng) * kmPerLng * pxPerKm,
    y: CY - (lat - cLat) * KM_PER_LAT * pxPerKm,
  };
}

export default function ZoneMap({ zone, buildings }: ZoneMapProps) {
  const hasGeo = zone.center_lat != null && zone.center_lng != null && zone.radius_km != null;

  if (!hasGeo) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center">
        <MapPin className="mb-2 h-6 w-6 text-gray-300" />
        <p className="text-xs font-bold text-gray-500">No geographic boundary defined</p>
        <p className="mt-1 text-[11px] text-gray-400">Edit the zone to set a center point and radius.</p>
      </div>
    );
  }

  const cLat = zone.center_lat as number;
  const cLng = zone.center_lng as number;
  const radius = zone.radius_km as number;
  const pxPerKm = Math.min(60, Math.max(8, 120 / radius));
  const zoneRadiusPx = radius * pxPerKm;

  const validBuildings = buildings
    .filter((b) => b.latitude != null && b.longitude != null && !(b.latitude === 0 && b.longitude === 0))
    .map((b) => ({
      ...b,
      pos: toXY(b.latitude as number, b.longitude as number, cLat, cLng, pxPerKm),
    }));

  const mapsUrl = `https://www.google.com/maps?q=${cLat},${cLng}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full">
          <defs>
            <pattern id="zm-dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(16,185,129,0.12)" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#zm-dots)" />

          {/* Zone boundary circle */}
          <circle
            cx={CX} cy={CY} r={zoneRadiusPx}
            fill="rgba(16,185,129,0.05)"
            stroke="rgba(16,185,129,0.4)"
            strokeWidth="2"
            strokeDasharray="8 6"
          />

          {/* Building dots */}
          {validBuildings.map((b, i) => (
            <g key={b.custom_id || i}>
              <circle cx={b.pos.x} cy={b.pos.y} r="10" fill="rgba(59,130,246,0.15)">
                <animate attributeName="r" values="6;12;6" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={b.pos.x} cy={b.pos.y} r="4" fill="#2563eb" stroke="#fff" strokeWidth="1.5" />
            </g>
          ))}

          {/* Center crosshair */}
          <path d={`M${CX - 6} ${CY} L${CX + 6} ${CY} M${CX} ${CY - 6} L${CX} ${CY + 6}`} stroke="#059669" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <div>
          <p className={`${display.className} text-sm font-extrabold text-gray-900`}>{zone.zone_name}</p>
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
            {radius.toFixed(1)} km radius · {validBuildings.length} building{validBuildings.length === 1 ? "" : "s"} plotted
          </p>
        </div>
        <a
          href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700"
        >
          Open in Maps <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}