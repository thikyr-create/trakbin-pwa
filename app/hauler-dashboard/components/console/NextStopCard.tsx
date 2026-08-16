// app/hauler-dashboard/components/console/NextStopCard.tsx
"use client";

import { Navigation, CircleCheck, Building2, SkipForward } from 'lucide-react';
import type { RouteBuilding } from '../types';

interface Props {
  stop: RouteBuilding;
  isArrived: boolean;
  distanceM: number | null;
  etaMin: number | null;
  onNavigate: () => void;
  onConfirm: () => void;
  onSkip: () => void; // ← New prop
}

export default function NextStopCard({ stop, isArrived, distanceM, etaMin, onNavigate, onConfirm, onSkip }: Props) {
  const s: any = stop;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
          {s.sequence ?? '–'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {isArrived ? 'Arrived at' : 'Next stop'}
          </p>
          <h3 className="text-lg font-black text-gray-900 leading-tight truncate">{s.building_id}</h3>
          <p className="text-xs text-gray-600 truncate">{s.address || 'Address unavailable'}</p>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {s.building_type && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                <Building2 size={10} /> {s.building_type}
              </span>
            )}
            {s.estate && (
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                {s.estate}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-gray-900">
            {distanceM != null ? (distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${Math.round(distanceM)} m`) : '—'}
          </p>
          <p className="text-xs font-bold text-emerald-700">{etaMin != null ? `${etaMin} min` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
        >
          <Navigation size={16} /> Navigate
        </button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
        >
          <SkipForward size={16} /> Skip
        </button>
        <button
          onClick={onConfirm}
          disabled={!isArrived}
          className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <CircleCheck size={16} /> Confirm
        </button>
      </div>
      {!isArrived && (
        <p className="text-[10px] font-semibold text-gray-400 text-center -mt-1">
          Confirm unlocks automatically inside the 25 m arrival zone
        </p>
      )}
    </div>
  );
}