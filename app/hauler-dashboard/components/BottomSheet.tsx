"use client";

import { motion } from 'framer-motion';
import { MapPin, Package, DollarSign, Users, Navigation, AlertTriangle } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import SwipeButton from './SwipeButton';

export default function BottomSheet() {
  // ✅ Read directly from the Operational Engine
  const { currentStop, isArrived, completePickup, setShowSkipModal } = useDriverSession();

  const handleNavigate = () => {
    if (!currentStop || !currentStop.latitude || !currentStop.longitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (!currentStop) {
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
      initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="bg-slate-900/95 backdrop-blur-xl rounded-t-[18px] shadow-2xl border-t border-slate-800 overflow-hidden"
    >
      <div className="w-full flex justify-center pt-3 pb-1"><div className="w-12 h-1.5 bg-slate-700 rounded-full"></div></div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isArrived ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {isArrived ? 'Arrived' : 'En Route'}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Stop #{currentStop.sequence}</span>
            </div>
            <h2 className="text-xl font-black text-white">{currentStop.building_id}</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12} /> {currentStop.address || 'Unknown Address'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Users size={10} /> Occupancy</p>
            <p className="text-sm font-black text-white mt-1">{currentStop.occupancy || 'N/A'}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Package size={10} /> Est. Waste</p>
            <p className="text-sm font-black text-white mt-1">{currentStop.estimated_waste || 'N/A'}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><DollarSign size={10} /> Payment</p>
            <p className={`text-sm font-black mt-1 ${currentStop.payment_status === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>{currentStop.payment_status?.toUpperCase() || 'N/A'}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">Waste Type</p>
            <p className="text-sm font-black text-white mt-1">{currentStop.waste_type || 'N/A'}</p>
          </div>
        </div>

        {isArrived ? (
          <div className="space-y-3">
            <SwipeButton onSwipe={completePickup} />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleNavigate} className="flex items-center justify-center gap-2 py-3 bg-blue-600/20 text-blue-400 font-bold rounded-xl text-sm uppercase hover:bg-blue-600/30 transition-colors border border-blue-600/50">
                <Navigation size={16} /> Navigate
              </button>
              <button onClick={() => useDriverSession.getState().setShowReportModal(true)} className="flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-400 font-bold rounded-xl text-sm uppercase hover:bg-red-600/30 transition-colors border border-red-600/50">
                <AlertTriangle size={16} /> Report Issue
              </button>
            </div>
            <button onClick={() => setShowSkipModal(true)} className="w-full py-3 bg-slate-800 text-gray-400 font-bold rounded-xl text-sm uppercase hover:bg-slate-700 transition-colors border border-slate-700">Skip Stop</button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={handleNavigate} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-black rounded-xl text-sm uppercase hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
              <Navigation size={16} /> Navigate to Stop
            </button>
            <button onClick={() => setShowSkipModal(true)} className="w-full py-3 bg-slate-800 text-gray-400 font-bold rounded-xl text-sm uppercase hover:bg-slate-700 transition-colors border border-slate-700">Skip Stop</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}