// app/hauler-dashboard/components/stops/StopListItem.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Building2, Package, DollarSign, Clock } from 'lucide-react';

interface Props {
  stop: any;
  isNext: boolean;
  liveDistanceM: number | null;
  legDistanceM: number | null;
  selected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}

function statusChip(stop: any, isNext: boolean) {
  if (stop.status === 'completed')
    return <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold uppercase text-gray-500">Completed</span>;
  if (stop.status === 'skipped')
    return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[10px] font-bold uppercase text-amber-700">Skipped</span>;
  if (isNext)
    return <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-[10px] font-bold uppercase text-white">Next</span>;
  return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold uppercase text-emerald-700 border border-emerald-200">Pending</span>;
}

function badgeColor(stop: any, isNext: boolean) {
  if (stop.status === 'completed') return 'bg-gray-300 text-white';
  if (stop.status === 'skipped') return 'bg-amber-500 text-white';
  if (isNext) return 'bg-emerald-600 text-white ring-4 ring-emerald-100';
  return 'bg-white text-emerald-700 border-2 border-emerald-600';
}

export default function StopListItem({ stop, isNext, liveDistanceM, legDistanceM, selected, onSelect, onNavigate }: Props) {
  const distanceM = isNext ? liveDistanceM : legDistanceM;
  const etaMin = distanceM != null ? Math.max(1, Math.round((distanceM / 1000 / 25) * 60)) : null;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-colors ${isNext ? 'border-emerald-300' : 'border-gray-200'}`}>
      <button onClick={onSelect} className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50">
        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${badgeColor(stop, isNext)}`}>
          {stop.sequence}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-gray-900 truncate">{stop.building_id}</h3>
            {statusChip(stop, isNext)}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{stop.address || 'Address unavailable'}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {stop.building_type && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[9px] font-bold uppercase text-gray-500">
                <Building2 size={9} /> {stop.building_type}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-black text-gray-900">
            {distanceM != null ? (distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${Math.round(distanceM)} m`) : '—'}
          </p>
          {etaMin != null && (
            <p className="text-[10px] font-bold text-gray-400 flex items-center justify-end gap-1"><Clock size={9} /> {etaMin} min</p>
          )}
        </div>
      </button>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-4 grid grid-cols-2 gap-2">
              <div className="col-span-2 bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin size={10} /> Address</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.address || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Estate</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.estate || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Type</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.building_type || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Package size={10} /> Units</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.number_of_units ?? 'N/A'} {stop.unit_type || ''}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><DollarSign size={10} /> Payment</p>
                <p className={`text-sm font-black mt-1 ${stop.payment_status === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stop.payment_status?.toUpperCase() || 'N/A'}
                </p>
              </div>
              {stop.status === 'skipped' && stop.skip_reason && (
                <div className="col-span-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">Skip reason</p>
                  <p className="text-sm font-bold text-amber-800 mt-1">{stop.skip_reason}</p>
                </div>
              )}
              {stop.status === 'completed' && stop.completion_time && (
                <div className="col-span-2 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Completed at</p>
                  <p className="text-sm font-bold text-emerald-800 mt-1">
                    {new Date(stop.completion_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              <button
                onClick={onNavigate}
                disabled={stop.latitude == null || stop.longitude == null}
                className="col-span-2 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400"
              >
                <Navigation size={16} /> View on Map
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}