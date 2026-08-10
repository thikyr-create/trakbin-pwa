// app/hauler-dashboard/components/console/SearchPauseBar.tsx
"use client";

import { Search, Pause, Play } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useState } from 'react';
import { CONSOLE_TOKENS } from '@/lib/features/driver-console/constants/console';

export default function SearchPauseBar() {
  const { route, isRoutePaused, toggleRoutePause, searchQuery, setSearchQuery, searchGeocode } = useDriverSession();
  const [focused, setFocused] = useState(false);

  if (!route) return null;

  return (
    <div className="absolute top-[72px] left-4 right-4 z-20 flex items-center gap-2">
      <div className="flex-1 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchGeocode(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search assigned stops or places..."
          className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-gray-900 shadow-lg border border-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      <button
        onClick={toggleRoutePause}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-lg border border-gray-200 transition-all active:scale-95"
        style={{
          backgroundColor: isRoutePaused ? CONSOLE_TOKENS.green : '#FFFFFF',
          color: isRoutePaused ? '#FFFFFF' : CONSOLE_TOKENS.text,
        }}
      >
        {isRoutePaused ? <Play size={18} /> : <Pause size={18} />}
        {isRoutePaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
}