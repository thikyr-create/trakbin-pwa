// app/hauler-dashboard/components/more/ToolsList.tsx
"use client";

import { Pause, Play, Flag, Power, ChevronRight } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';

export default function ToolsList() {
  const { route, isRoutePaused, toggleRoutePause, setShowReportModal, setShowEndShiftModal } = useDriverSession();
  const { setPauseModalOpen } = useConsoleStore();

  const rows = [
    {
      icon: isRoutePaused ? Play : Pause,
      label: isRoutePaused ? 'Resume Route' : 'Pause Route',
      hint: isRoutePaused ? 'Route is paused' : 'For disposal drops, breaks',
      onClick: () => (isRoutePaused ? toggleRoutePause() : setPauseModalOpen(true)),
      show: !!route,
    },
    {
      icon: Flag,
      label: 'Report an Issue',
      hint: 'Send a field report to dispatch',
      onClick: () => setShowReportModal(true),
      show: true,
    },
    {
      icon: Power,
      label: 'End Shift',
      hint: 'Complete the current route',
      onClick: () => setShowEndShiftModal(true),
      show: !!route,
    },
  ].filter((r) => r.show);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Tools</p>
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <button
            key={r.label}
            onClick={r.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 ${i > 0 ? 'border-t border-gray-100' : ''}`}
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon size={17} className="text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{r.label}</p>
              <p className="text-[11px] text-gray-400">{r.hint}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        );
      })}
    </div>
  );
}