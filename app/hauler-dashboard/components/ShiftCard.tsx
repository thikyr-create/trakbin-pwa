"use client";

import { motion } from 'framer-motion';
import { Truck, MapPin, User, ChevronUp, ChevronDown, Route } from 'lucide-react';
import { DriverRoute } from './types';
import { useState } from 'react';

interface ShiftCardProps {
  route: DriverRoute | null;
}

export default function ShiftCard({ route }: ShiftCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!route) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-800"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
          <p className="text-xs font-bold text-gray-400 uppercase">OFFLINE</p>
        </div>
        <p className="text-sm text-gray-400 mt-2">Waiting for route assignment...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 overflow-hidden"
    >
      {/* Collapsed Header - Always Visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
            <Route size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-xs font-bold text-emerald-400 uppercase">ON SHIFT</p>
            </div>
            <p className="text-sm font-black text-white mt-0.5">{route.total_stops} Stops Today</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4 border-t border-slate-800"
        >
          <div className="pt-4 space-y-3">
            {/* Driver Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Driver:</span>
              </div>
              <span className="text-sm font-bold text-white">Michael</span>
            </div>

            {/* Truck Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Truck:</span>
              </div>
              <span className="text-sm font-bold text-white">{route.truck_id}</span>
            </div>

            {/* Zone Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Zone:</span>
              </div>
              <span className="text-sm font-bold text-white">{route.zone_id}</span>
            </div>

            {/* Route Stats */}
            <div className="bg-slate-800/50 rounded-xl p-3 mt-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Today's Route</span>
                <span className="text-sm font-black text-white">{route.total_stops} Stops</span>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-lg font-black text-emerald-400">{route.completed_stops}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-black text-orange-400">{route.total_stops - route.completed_stops}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}