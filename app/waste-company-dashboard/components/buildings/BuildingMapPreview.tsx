"use client";

import { MapPin, ExternalLink, Crosshair } from "lucide-react";
import { Sora, JetBrains_Mono } from "next/font/google";

const display = Sora({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

const KM_PER_LAT = 110.574;
const W = 400;
const H = 240;
const CX = W / 2;
const CY = H / 2;

interface ZoneGeo {
  zone_name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
}

interface BuildingMapPreviewProps {
  latitude?: number | string | null;
  longitude?: number | string | null;
  zone?: ZoneGeo | null;
  routeGeometry?: any | null;
  issues?: Array<{ latitude?: number | string | null; longitude?: number | string | null }>;
}

function num(v?: number | string | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isValidCoord(lat: number | null, lng: number | null): boolean {
  return lat != null && lng != null && !(lat === 0 && lng === 0);
}

function toXY(
  lat: number,
  lng: number,
  cLat: number,
  cLng: number,
  pxPerKm: number
): { x: number; y: number } {
  const kmPerLng = 111.32 * Math.cos((cLat * Math.PI) / 180) || 1;
  return {
    x: CX + (lng - cLng) * kmPerLng * pxPerKm,
    y: CY - (lat - cLat) * KM_PER_LAT * pxPerKm,
  };
}

function parseGeometry(g: any): Array<[number, number]> | null {
  if (!g) return null;

  let arr: any[] | null = null;
  if (Array.isArray(g)) arr = g;
  else if (typeof g === "object" && Array.isArray(g.coordinates)) arr = g.coordinates;

  if (!arr) return null;

  const pts = arr
    .filter((p: any) => Array.isArray(p) && p.length >= 2)
    .map((p: any) => [Number(p[0]), Number(p[1])] as [number, number])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

  return pts.length > 1 ? pts : null;
}

export default function BuildingMapPreview({
  latitude,
  longitude,
  zone = null,
  routeGeometry = null,
  issues = [],
}: BuildingMapPreviewProps) {
  const lat = num(latitude);
  const lng = num(longitude);
  const hasBuildingPin = isValidCoord(lat, lng);

  if (!hasBuildingPin) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <Crosshair className="mb-2 h-7 w-7 text-gray-300" />
        <p className="text-sm font-bold text-gray-500">No GPS lock recorded</p>
        <p className="mt-1 text-[11px] font-medium text-gray-400">
          Capture coordinates on the next visit to enable zone and route checks.
        </p>
      </div>
    );
  }

  const centerLat = zone?.center_lat ?? (lat as number);
  const centerLng = zone?.center_lng ?? (lng as number);

  const pxPerKm =
    zone && zone.radius_km > 0
      ? Math.min(80, Math.max(4, 90 / zone.radius_km))
      : 30;

  const pin = toXY(lat as number, lng as number, centerLat, centerLng, pxPerKm);

  const route = parseGeometry(routeGeometry);
  const routePath = route
    ? route
        .map(([gLng, gLat], i) => {
          const p = toXY(gLat, gLng, centerLat, centerLng, pxPerKm);
          return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(" ")
    : null;

  const zoneRadiusPx = zone ? zone.radius_km * pxPerKm : 0;

  const issueDots = issues
    .map((iss) => ({
      lat: num(iss.latitude),
      lng: num(iss.longitude),
    }))
    .filter((p) => isValidCoord(p.lat, p.lng))
    .map((p) => toXY(p.lat as number, p.lng as number, centerLat, centerLng, pxPerKm));

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[180px] w-full">
          {/* Ambient dot grid */}
          <defs>
            <pattern id="bm-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(16,185,129,0.14)" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#bm-dots)" />

          {/* Zone circle */}
          {zone && (
            <circle
              cx={CX}
              cy={CY}
              r={zoneRadiusPx}
              fill="rgba(16,185,129,0.07)"
              stroke="rgba(16,185,129,0.35)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
          )}

          {/* Route polyline */}
          {routePath && (
            <path d={routePath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          )}

          {/* Issue dots */}
          {issueDots.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
          ))}

          {/* Building pin */}
          <circle cx={pin.x} cy={pin.y} r="14" fill="rgba(16,185,129,0.18)">
            <animate attributeName="r" values="10;16;10" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={pin.x} cy={pin.y} r="6" fill="#059669" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-gray-500`}>
          {zone ? zone.zone_name : "No zone resolved"}
          {zone ? ` · ${zone.radius_km} km radius` : ""}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700"
        >
          Open in Maps <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}