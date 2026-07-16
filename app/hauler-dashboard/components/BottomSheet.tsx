"use client";

import { motion } from 'framer-motion';
import { MapPin, Package, DollarSign, Users } from 'lucide-react';
import { RouteBuilding } from './types';
import SwipeButton from './SwipeButton'; // Import the new swipe button

interface BottomSheetProps {
  stop: RouteBuilding | null;
  isArrived: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function BottomSheet({ stop, isArrived, onComplete, onSkip }: BottomSheetProps) {
  if (!stop) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-t-[18px] p-5 shadow-2xl border-t border-slate-800 text-center">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
        <p className="text-sm font-medium text-gray-300">Navigating to next stop...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="bg-slate-900/95 backdrop-blur-xl rounded-t-[18px] shadow-2xl border-t border-slate-800 overflow-hidden"
    >
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-3 pb-1">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                isArrived ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {isArrived ? 'Arrived' : 'En Route'}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Stop #{stop.sequence}</span>
            </div>
            <h2 className="text-xl font-black text-white">{stop.building_id}</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin size={12} /> {stop.address}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Users size={10} /> Occupancy</p>
            <p className="text-sm font-black text-white mt-1">{stop.occupancy}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Package size={10} /> Est. Waste</p>
            <p className="text-sm font-black text-white mt-1">{stop.estimated_waste}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><DollarSign size={10} /> Payment</p>
            <p className={`text-sm font-black mt-1 ${stop.payment_status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
              {stop.payment_status?.toUpperCase()}
            </p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">Waste Type</p>
            <p className="text-sm font-black text-white mt-1">{stop.waste_type}</p>
          </div>
        </div>

        {/* Actions */}
        {isArrived ? (
          <div className="space-y-3">
            {/* ✅ REAL SWIPE BUTTON */}
            <SwipeButton onSwipe={onComplete} />
            
            <button 
              onClick={onSkip}
              className="w-full py-3 bg-slate-800 text-gray-400 font-bold rounded-xl text-sm uppercase hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Skip Stop
            </button>
          </div>
        ) : (
          <div className="w-full py-4 bg-slate-800 text-gray-500 font-bold rounded-xl text-center text-sm uppercase border border-slate-700">
            Arrive at location to unlock actions
          </div>
        )}
      </div>
    </motion.div>
  );
}