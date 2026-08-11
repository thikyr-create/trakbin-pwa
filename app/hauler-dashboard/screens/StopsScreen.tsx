// app/hauler-dashboard/screens/StopsScreen.tsx
"use client";

import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import StopListItem from '../components/stops/StopListItem';
import { calculateDistanceInMeters } from '../utils/geo';

export default function StopsScreen() {
  const { route, routeStops, currentStop, gpsLocation, flyToLocation } = useDriverSession();
  const { setActiveTab, selectedStopId, setSelectedStopId } = useConsoleStore();

  const sorted = useMemo(() => [...routeStops].sort((a, b) => a.sequence - b.sequence), [routeStops]);
  const completed = sorted.filter((s) => s.status === 'completed').length;
  const skipped = sorted.filter((s) => s.status === 'skipped').length;
  const nextId = sorted.find((s) => s.status === 'pending')?.id;

  if (!route) {
    return (
      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
            <Package size={26} className="text-gray-500" />
          </div>
          <p className="font-black text-gray-700">No route assigned</p>
          <p className="mt-1 text-sm text-gray-500">Your assigned stops will appear here once dispatch assigns a route.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">Stops</h2>
          <p className="text-xs font-semibold text-gray-500">In route order</p>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black">{completed} done</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-black">{skipped} skipped</span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-black">{sorted.length - completed - skipped} left</span>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-2">
        {sorted.map((stop: any, i: number) => {
          const prev = i > 0 ? sorted[i - 1] : null;
          const legDistanceM =
            prev?.latitude != null && prev?.longitude != null && stop.latitude != null && stop.longitude != null
              ? calculateDistanceInMeters(prev.latitude, prev.longitude, stop.latitude, stop.longitude)
              : null;
          const liveDistanceM =
            gpsLocation && stop.latitude != null && stop.longitude != null
              ? calculateDistanceInMeters(gpsLocation.lat, gpsLocation.lng, stop.latitude, stop.longitude)
              : null;

          return (
            <StopListItem
              key={stop.id}
              stop={stop}
              isNext={stop.id === nextId}
              liveDistanceM={liveDistanceM}
              legDistanceM={legDistanceM}
              selected={selectedStopId === stop.id}
              onSelect={() => setSelectedStopId(selectedStopId === stop.id ? null : stop.id)}
              onNavigate={() => {
                flyToLocation(stop.latitude, stop.longitude, 17);
                setActiveTab('map');
              }}
            />
          );
        })}
      </div>
    </div>
  );
}