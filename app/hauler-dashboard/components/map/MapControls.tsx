// app/hauler-dashboard/components/map/MapControls.tsx
"use client";

import { useState } from 'react';
import { LocateFixed, Layers } from 'lucide-react';
import type mapboxgl from 'mapbox-gl';
import { useDriverSession } from '@/lib/store/useDriverSession';

const STYLES = [
  { id: 'satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'streets', url: 'mapbox://styles/mapbox/streets-v12' },
] as const;

export default function MapControls({ map }: { map: mapboxgl.Map | null }) {
  const { gpsLocation, centerOnDriver } = useDriverSession();
  const [styleIdx, setStyleIdx] = useState(0);

  const recenter = () => {
    centerOnDriver();
    if (gpsLocation && map) map.flyTo({ center: [gpsLocation.lng, gpsLocation.lat], zoom: 17, duration: 900 });
  };

  const toggleStyle = () => {
    if (!map) return;
    const next = (styleIdx + 1) % STYLES.length;
    setStyleIdx(next);
    map.setStyle(STYLES[next].url);
  };

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
      <button
        onClick={recenter}
        className="w-11 h-11 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center active:scale-95 transition-all"
        title="Re-center on my location"
      >
        <LocateFixed size={20} className="text-emerald-700" />
      </button>
      <button
        onClick={toggleStyle}
        className="w-11 h-11 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center active:scale-95 transition-all"
        title="Switch map style"
      >
        <Layers size={20} className="text-gray-700" />
      </button>
    </div>
  );
}