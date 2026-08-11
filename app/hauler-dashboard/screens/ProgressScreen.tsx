// app/hauler-dashboard/screens/ProgressScreen.tsx
"use client";

import { Package, Weight, Route, Clock, CircleCheck, Target } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useProgress } from '@/lib/features/driver-console/hooks/useProgress';
import ProgressRing from '../components/progress/ProgressRing';
import SummaryRow from '../components/progress/SummaryRow';

function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ProgressScreen() {
  const { route } = useDriverSession();
  const p = useProgress();

  if (!route) {
    return (
      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
            <Package size={26} className="text-gray-500" />
          </div>
          <p className="font-black text-gray-700">No progress yet</p>
          <p className="mt-1 text-sm text-gray-500">Progress appears once a route is assigned and started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-lg font-black text-gray-900">Progress</h2>
        <p className="text-xs font-semibold text-gray-500">Today's collection run</p>
      </div>

      <div className="px-4 space-y-3 pb-6">
        {/* Ring + counts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-5">
          <ProgressRing pct={p.pct} />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Completed</span>
              <span className="text-lg font-black text-emerald-600">{p.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">On route</span>
              <span className="text-lg font-black text-blue-600">{p.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">Remaining</span>
              <span className="text-lg font-black text-amber-600">{p.remaining}</span>
            </div>
            {p.skipped > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Skipped</span>
                <span className="text-lg font-black text-red-500">{p.skipped}</span>
              </div>
            )}
          </div>
        </div>

        {/* Collection summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-2">
          <p className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Collection summary</p>
          <SummaryRow Icon={Weight} label="Waste collected" value={p.wasteKg != null ? `${p.wasteKg} kg` : '—'} />
          <SummaryRow Icon={Route} label="Distance travelled" value={p.traveledKm != null ? `${p.traveledKm} km` : '—'} />
          <SummaryRow Icon={Clock} label="Time on route" value={p.timeOnRouteMin != null ? fmtTime(p.timeOnRouteMin) : '—'} />
          <SummaryRow Icon={CircleCheck} label="Stops on time" value={p.onTime ? `${p.onTime.done} / ${p.onTime.total}` : '—'} />
          <SummaryRow Icon={Target} label="Success rate" value={p.successRate != null ? `${Math.round(p.successRate * 100)}%` : '—'} />
        </div>
      </div>
    </div>
  );
}