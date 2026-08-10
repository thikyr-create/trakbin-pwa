// app/hauler-dashboard/components/console/TopBar.tsx
"use client";

import { Menu, Bell, LogOut } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';

export default function TopBar() {
  const { route, isRoutePaused } = useDriverSession();
  const onShift = !!route && route.status !== 'completed';

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Menu size={22} className="text-gray-700" />
        </button>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wide ${
            onShift
              ? isRoutePaused
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              onShift ? (isRoutePaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-gray-400'
            }`}
          />
          {onShift ? (isRoutePaused ? 'ON SHIFT · PAUSED' : 'ON SHIFT') : 'OFF SHIFT'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative">
          <Bell size={20} className="text-gray-700" />
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('trakbin_driver');
            window.location.href = '/';
          }}
          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
          title="Sign out"
        >
          <LogOut size={20} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}