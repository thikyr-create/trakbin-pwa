"use client";

import { Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface RouteProgressCardProps {
  completed: number;
  remaining: number;
  totalDistanceKm: number;
  etaMinutes: number;
}

export default function RouteProgressCard({ completed, remaining, totalDistanceKm, etaMinutes }: RouteProgressCardProps) {
  
  // Format ETA (e.g., 105 mins -> "1 hr 45 min")
  const formatETA = (mins: number) => {
    if (mins < 1) return "< 1 min";
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    if (hours > 0) return `${hours} hr ${minutes} min`;
    return `${minutes} min`;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] p-4 shadow-lg border border-slate-800">
      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
        <div 
          className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(completed / (completed + remaining)) * 100}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Stats Column 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Completed</p>
              <p className="text-lg font-black text-white">{completed}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-orange-400" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Remaining</p>
              <p className="text-lg font-black text-white">{remaining}</p>
            </div>
          </div>
        </div>

        {/* Stats Column 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-blue-400" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Distance</p>
              <p className="text-lg font-black text-white">{totalDistanceKm.toFixed(1)} km</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-purple-400" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">ETA</p>
              <p className="text-lg font-black text-white">{formatETA(etaMinutes)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}