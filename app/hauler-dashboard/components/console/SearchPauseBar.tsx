// app/hauler-dashboard/components/console/SearchPauseBar.tsx
"use client";

import { Search, Pause, Play, Building2, MapPin } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { useState } from 'react';

export default function SearchPauseBar() {
  const {
    route, isRoutePaused, toggleRoutePause,
    searchQuery, setSearchQuery, searchGeocode, geocodeResults, selectGeocodeResult,
  } = useDriverSession();
  const { setPauseModalOpen } = useConsoleStore();
  const [focused, setFocused] = useState(false);

  if (!route) return null;
  const showResults = focused && searchQuery.trim().length > 0;

  return (
    <div className="absolute top-[68px] left-4 right-4 z-20">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); searchGeocode(e.target.value); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search assigned stops or places..."
            className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-gray-900 shadow-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <button
          onClick={() => (isRoutePaused ? toggleRoutePause() : setPauseModalOpen(true))}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg border transition-all active:scale-95 ${
            isRoutePaused
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-900 border-gray-200'
          }`}
        >
          {isRoutePaused ? <Play size={18} /> : <Pause size={18} />}
          {isRoutePaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {showResults && (
        <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-72 overflow-y-auto">
          {geocodeResults.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No matches</p>
          ) : (
            geocodeResults.map((r) => (
              <button
                key={r.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectGeocodeResult(r)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
              >
                {r.type === 'building'
                  ? <Building2 size={18} className="text-emerald-600 shrink-0" />
                  : <MapPin size={18} className="text-gray-400 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.place_name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {r.type === 'building' ? 'Assigned stop' : 'Place'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}