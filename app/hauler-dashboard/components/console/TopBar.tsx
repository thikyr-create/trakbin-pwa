// app/hauler-dashboard/components/console/TopBar.tsx
"use client";

import { Menu, Bell, LogOut } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { useDriverNotifications } from '@/lib/features/driver-console/hooks/useDriverNotifications';

export default function TopBar() {
  const { route, isRoutePaused } = useDriverSession();
  const { setActiveTab, setNotifOpen } = useConsoleStore();
  const { unread } = useDriverNotifications();
  const onShift = !!route && route.status !== 'completed';

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('more')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Menu"
        >
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
        <button
          onClick={() => setNotifOpen(true)}
          className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Notifications"
        >
          <Bell size={20} className="text-gray-700" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
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