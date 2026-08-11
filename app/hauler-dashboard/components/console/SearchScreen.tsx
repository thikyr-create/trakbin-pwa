// app/hauler-dashboard/components/console/SearchScreen.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { X, Search, MapPin, Building2, LocateFixed, Clock, Trash2 } from 'lucide-react';
import { useDriverSession, type GeocodeResult } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { calculateDistanceInMeters } from '../../utils/geo';

const MAX_RECENTS = 8;
const keyFor = (driverId: string | null) => `trakbin_driver_recent_searches_${driverId ?? 'anon'}`;

export default function SearchScreen() {
  const { searchOpen, setSearchOpen, setSearchDestination, setActiveTab } = useConsoleStore();
  const {
    driver, searchQuery, setSearchQuery, searchGeocode, geocodeResults, selectGeocodeResult, gpsLocation,
  } = useDriverSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [recents, setRecents] = useState<GeocodeResult[]>([]);

  const driverId = driver?.employee_id || driver?.id || null;

  // Load recents + focus input on open
  useEffect(() => {
    if (searchOpen) {
      try {
        const raw = localStorage.getItem(keyFor(driverId));
        setRecents(raw ? (JSON.parse(raw) as GeocodeResult[]) : []);
      } catch {
        setRecents([]);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [searchOpen, driverId]);

  if (!searchOpen) return null;

  const close = () => { setSearchOpen(false); setSearchQuery(''); };

  const saveRecent = (r: GeocodeResult) => {
    const list = [r, ...recents.filter((x) => x.id !== r.id)].slice(0, MAX_RECENTS);
    setRecents(list);
    try { localStorage.setItem(keyFor(driverId), JSON.stringify(list)); } catch {}
  };

  const clearRecents = () => {
    setRecents([]);
    try { localStorage.removeItem(keyFor(driverId)); } catch {}
  };

  const distLabel = (center: [number, number]) => {
    if (!gpsLocation) return null;
    const m = calculateDistanceInMeters(gpsLocation.lat, gpsLocation.lng, center[1], center[0]);
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  };

  const pick = (r: GeocodeResult) => {
    saveRecent(r);
    setSearchDestination({ lat: r.center[1], lng: r.center[0], label: r.place_name });
    selectGeocodeResult(r);
    setActiveTab('map');
    close();
  };

  const showRecents = !searchQuery.trim();

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <button onClick={close} className="p-2 hover:bg-gray-100 rounded-xl">
          <X size={22} className="text-gray-800" />
        </button>
        <h2 className="text-base font-black text-gray-900">Route</h2>
        <div className="w-10" />
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Origin */}
        <div className="flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3.5">
          <LocateFixed size={16} className="text-blue-600" />
          <p className="text-sm font-bold text-gray-700">Current location</p>
        </div>

        {/* Destination */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); searchGeocode(e.target.value); }}
            placeholder="Dropoff location"
            className="w-full rounded-2xl border-2 border-emerald-600 bg-white pl-11 pr-4 py-3.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Results / Recents */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {showRecents ? (
          recents.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              Search assigned stops, streets, landmarks…
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Recent searches</p>
                <button onClick={clearRecents} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-500 hover:text-red-600">
                  <Trash2 size={12} /> Clear
                </button>
              </div>
              {recents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => pick(r)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-left rounded-xl"
                >
                  <Clock size={18} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{r.place_name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {r.type === 'building' ? 'Assigned stop' : 'Place'}
                    </p>
                  </div>
                  {distLabel(r.center) && (
                    <p className="text-xs font-bold text-gray-500 shrink-0">{distLabel(r.center)}</p>
                  )}
                </button>
              ))}
            </>
          )
        ) : geocodeResults.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">No results found</p>
        ) : (
          geocodeResults.map((r) => (
            <button
              key={r.id}
              onClick={() => pick(r)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 text-left rounded-xl"
            >
              {r.type === 'building'
                ? <Building2 size={18} className="text-emerald-600 shrink-0" />
                : <MapPin size={18} className="text-gray-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{r.place_name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {r.type === 'building' ? 'Assigned stop' : 'Place'}
                </p>
              </div>
              {distLabel(r.center) && (
                <p className="text-xs font-bold text-gray-500 shrink-0">{distLabel(r.center)}</p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}