// app/hauler-dashboard/components/map/GpsChip.tsx
"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';

export default function GpsChip({ className = 'bottom-[52px]' }: { className?: string }) {
  const { gpsLocation, gpsAccuracy } = useDriverSession();
  const { sheetState } = useConsoleStore();

  const unusable = gpsAccuracy != null && gpsAccuracy > 1000;
  const quality =
    !gpsLocation || unusable || gpsAccuracy == null
      ? null
      : gpsAccuracy <= 15 ? 'High' : gpsAccuracy <= 40 ? 'Medium' : 'Low';
  const bars = quality === 'High' ? 3 : quality === 'Medium' ? 2 : quality === 'Low' ? 1 : 0;

  return (
    <AnimatePresence>
      {sheetState !== 'expanded' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`absolute left-3 z-30 ${className} bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2`}
        >
          <span className={`w-2 h-2 rounded-full ${quality ? 'bg-emerald-500' : 'bg-gray-400 animate-pulse'}`} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">GPS</p>
            <p className="text-[10px] font-semibold text-gray-500">
              {quality ? `${quality} accuracy · ±${Math.round(gpsAccuracy!)}m` : 'Acquiring…'}
            </p>
          </div>
          <div className="flex items-end gap-0.5 ml-1">
            {[1, 2, 3].map((b) => (
              <div key={b} className={`w-1 rounded-sm ${b <= bars ? 'bg-emerald-600' : 'bg-gray-300'}`} style={{ height: 4 + b * 3 }} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}