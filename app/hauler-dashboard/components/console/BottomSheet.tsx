// app/hauler-dashboard/components/console/BottomSheet.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';

export default function BottomSheet() {
  const { currentStop, isArrived, isRoutePaused } = useDriverSession();
  const { sheetState, setSheetState } = useConsoleStore();

  if (!currentStop || isRoutePaused) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: sheetState === 'collapsed' ? 'calc(100% - 140px)' : 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className="absolute bottom-[72px] left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-200 max-h-[65vh]"
      style={{ touchAction: 'none' }}
    >
      {/* Drag Handle */}
      <button
        onClick={() => setSheetState(sheetState === 'collapsed' ? 'expanded' : 'collapsed')}
        className="w-full flex justify-center pt-3 pb-2"
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </button>

      <div className="px-5 pb-5">
        <p className="text-xs font-bold uppercase text-gray-500 mb-1">
          {isArrived ? 'Arrived at' : 'Next Stop'}
        </p>
        <p className="text-lg font-black text-gray-900">{currentStop.building_id}</p>
        <p className="text-sm text-gray-600 mt-1">{currentStop.address || 'Address unavailable'}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (currentStop.latitude && currentStop.longitude) {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=driving`,
                  '_blank'
                );
              }
            }}
            className="py-3 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
          >
            Navigate
          </button>
          <button
            disabled={!isArrived}
            className="py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm Pickup
          </button>
        </div>
      </div>
    </motion.div>
  );
}