// app/hauler-dashboard/components/more/OfflineCard.tsx
"use client";

import { CloudOff, Cloud } from 'lucide-react';
import { useOfflineStatus } from '@/lib/features/driver-console/hooks/useOfflineStatus';

export default function OfflineCard() {
  const { online, queued } = useOfflineStatus();

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        online ? 'bg-white border-gray-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${online ? 'bg-emerald-50' : 'bg-amber-100'}`}>
          {online ? <Cloud size={20} className="text-emerald-600" /> : <CloudOff size={20} className="text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-gray-900">{online ? 'Online' : 'Offline mode'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {online
              ? 'Connected — activity syncs in real time.'
              : "You're offline. Data is stored on this device and will sync automatically when you're back online."}
          </p>
        </div>
        {!online && queued > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-800 text-xs font-black shrink-0">
            {queued} queued
          </span>
        )}
      </div>
    </div>
  );
}