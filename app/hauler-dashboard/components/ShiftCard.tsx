"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, User, ChevronUp, ChevronDown, Route } from 'lucide-react';
import { DriverRoute } from './types';
import { useDriverSession } from '@/lib/store/useDriverSession';

interface ShiftCardProps {
  route: DriverRoute | null;
}

export default function ShiftCard({ route }: ShiftCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ✅ Read pause state directly from the Operational Engine
  const { isRoutePaused } = useDriverSession();

  // Offline / No Route State
  if (!route) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md rounded-full px-4 py-3 shadow-lg border border-slate-800 flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        <p className="text-xs font-bold text-gray-400 uppercase">OFFLINE</p>
      </div>
    );
  }

  return (
    <motion.div 
      layout
      className="bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 overflow-hidden"
    >
      {/* Minimal Header - Always Visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRoutePaused ? 'bg-amber-500' : 'bg-emerald-600'}`}>
            <Route size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRoutePaused ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <p className={`text-[10px] font-bold uppercase ${isRoutePaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isRoutePaused ? 'Paused' : 'On Shift'}
              </p>
            </div>
            <p className="text-xs font-black text-white">{route.total_stops} Stops Today</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-3 pb-3 border-t border-slate-800 pt-3 space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1"><User size={12} /> Driver:</span>
            <span className="font-bold text-white">Michael</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1"><Truck size={12} /> Truck:</span>
            <span className="font-bold text-white">{route.truck_id}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1"><MapPin size={12} /> Zone:</span>
            <span className="font-bold text-white">{route.zone_id}</span>
          </div>
          
          <div className="flex gap-3 pt-2">
            <div className="flex-1 bg-slate-800/50 rounded-lg p-2 text-center border border-slate-700/50">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Done</p>
              <p className="text-sm font-black text-emerald-400">{route.completed_stops}</p>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-lg p-2 text-center border border-slate-700/50">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Left</p>
              <p className="text-sm font-black text-orange-400">{route.total_stops - route.completed_stops}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}