"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';

export default function EndShiftModal() {
  const { showEndShiftModal, setShowEndShiftModal, route, routeStops, endShift } = useDriverSession();

  const remainingStops = route ? route.total_stops - route.completed_stops : 0;

  return (
    <AnimatePresence>
      {showEndShiftModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowEndShiftModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase">End Shift</h3>
              <button onClick={() => setShowEndShiftModal(false)} className="p-1 hover:bg-slate-800 rounded-full">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-5">
              {remainingStops > 0 ? (
                <div className="flex items-start gap-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <AlertCircle size={20} className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-400">Unfinished Stops</p>
                    <p className="text-xs text-gray-400 mt-1">You have {remainingStops} remaining stop{remainingStops !== 1 ? 's' : ''} that will be marked as incomplete.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                  <CheckCircle size={20} className="text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Route Complete!</p>
                    <p className="text-xs text-gray-400 mt-1">Great job! All stops have been completed.</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Today's Summary</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Completed:</span>
                  <span className="text-lg font-black text-emerald-400">{route?.completed_stops || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Skipped:</span>
                  <span className="text-lg font-black text-amber-400">{routeStops.filter(s => s.status === 'skipped').length}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-sm text-gray-400">Total:</span>
                  <span className="text-lg font-black text-white">{route?.total_stops || 0}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">Are you sure you want to end your shift?</p>

              <button
                onClick={endShift}
                className="w-full py-3 bg-red-600 text-white font-black rounded-xl uppercase hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
              >
                Yes, End Shift
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}