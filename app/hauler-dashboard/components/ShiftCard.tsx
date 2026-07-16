"use client";

import { DriverRoute } from './types';

interface ShiftCardProps {
  route: DriverRoute | null;
}

export default function ShiftCard({ route }: ShiftCardProps) {
  if (!route) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] p-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
            OFFLINE
          </span>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          Waiting for route assignment...
        </p>
      </div>
    );
  }

  const remaining = route.total_stops - route.completed_stops;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-[18px] p-4 shadow-lg border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
            {route.status === 'active' ? 'ON SHIFT' : 'ASSIGNED'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase">
          {route.route_name}
        </span>
      </div>
      
      {/* Driver & Truck Info */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-400">Driver:</span>
          <span className="font-bold text-white">Michael</span> {/* Replace with route.driver_name later */}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Truck:</span>
          <span className="font-bold text-white">{route.truck_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Zone:</span>
          <span className="font-bold text-white">{route.zone_id}</span>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Today's Route</span>
          <span className="text-sm font-black text-white">{route.total_stops} Stops</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Completed</p>
            <p className="text-lg font-black text-emerald-400">{route.completed_stops}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Remaining</p>
            <p className="text-lg font-black text-orange-400">{remaining}</p>
          </div>
        </div>
      </div>
    </div>
  );
}