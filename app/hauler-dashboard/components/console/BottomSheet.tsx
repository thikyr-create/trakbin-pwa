// app/hauler-dashboard/components/console/BottomSheet.tsx
"use client";

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Camera, SkipForward, Flag, MapPin, Package, DollarSign, Building2 } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { calculateDistanceInMeters } from '../../utils/geo';
import NextStopCard from './NextStopCard';

export default function BottomSheet() {
  const {
    currentStop, isArrived, isRoutePaused, gpsLocation,
    completePickup, setShowSkipModal, setShowReportModal,
  } = useDriverSession();
  const { sheetState, setSheetState, openEvidence } = useConsoleStore();

  const touchStartY = useRef<number | null>(null);

  if (!currentStop || isRoutePaused) return null;

  const stop: any = currentStop;
  const distanceM =
    gpsLocation && stop.latitude != null && stop.longitude != null
      ? calculateDistanceInMeters(gpsLocation.lat, gpsLocation.lng, stop.latitude, stop.longitude)
      : null;
  const etaMin = distanceM != null ? Math.max(1, Math.round((distanceM / 1000 / 25) * 60)) : null;

  const onSwipe = (clientY: number, phase: 'start' | 'end', rawEnd?: number) => {
    if (phase === 'start') { touchStartY.current = clientY; return; }
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start == null || rawEnd == null) return;
    const delta = rawEnd - start;
    if (delta < -40) setSheetState('expanded');
    else if (delta > 40) setSheetState('collapsed');
  };

  const handleNavigate = () => {
    if (stop.latitude == null || stop.longitude == null) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=driving`,
      '_blank'
    );
  };

  const handleConfirm = async () => {
    const buildingId = stop.building_id;
    await completePickup();
    openEvidence('pickup', buildingId, `Pickup at ${buildingId}`);
  };

  const swipeProps = {
    onTouchStart: (e: React.TouchEvent) => onSwipe(e.touches[0].clientY, 'start'),
    onTouchEnd: (e: React.TouchEvent) => onSwipe(e.changedTouches[0].clientY, 'end', e.changedTouches[0].clientY),
  };

  // NOTE: onTouchEnd receives the end Y via rawEnd; fix signature usage below
  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touchStartY.current;
      touchStartY.current = null;
      if (start == null) return;
      const delta = e.changedTouches[0].clientY - start;
      if (delta < -40) setSheetState('expanded');
      else if (delta > 40) setSheetState('collapsed');
    },
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: sheetState === 'collapsed' ? '58%' : '12%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 260 }}
      className="absolute bottom-[72px] left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-200"
    >
      {/* Drag handle zone (swipe target) */}
      <div className="w-full flex justify-center pt-3 pb-2 cursor-grab" {...touchHandlers}>
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <div className="px-5 pb-5 overflow-y-auto max-h-[52vh]" {...(sheetState === 'collapsed' ? touchHandlers : {})}>
        <NextStopCard
          stop={currentStop}
          isArrived={isArrived}
          distanceM={distanceM}
          etaMin={etaMin}
          onNavigate={handleNavigate}
          onConfirm={handleConfirm}
        />

        {/* Expanded: details + secondary actions */}
        {sheetState === 'expanded' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="col-span-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin size={10} /> Address</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.address || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Estate</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.estate || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Building2 size={10} /> Type</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.building_type || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Package size={10} /> Units</p>
                <p className="text-sm font-black text-gray-900 mt-1">{stop.number_of_units ?? 'N/A'} {stop.unit_type || ''}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><DollarSign size={10} /> Payment</p>
                <p className={`text-sm font-black mt-1 ${stop.payment_status === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stop.payment_status?.toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => openEvidence('pickup', stop.building_id, `Evidence for ${stop.building_id}`)}
                className="flex flex-col items-center gap-1 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-[10px] uppercase border border-emerald-200 active:scale-95 transition-all"
              >
                <Camera size={16} /> Evidence
              </button>
              <button
                onClick={() => setShowSkipModal(true)}
                className="flex flex-col items-center gap-1 py-3 bg-amber-50 text-amber-700 font-bold rounded-xl text-[10px] uppercase border border-amber-200 active:scale-95 transition-all"
              >
                <SkipForward size={16} /> Skip
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex flex-col items-center gap-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl text-[10px] uppercase border border-red-200 active:scale-95 transition-all"
              >
                <Flag size={16} /> Report
              </button>
            </div>

            <button
              onClick={() => setSheetState('collapsed')}
              className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
            >
              <ChevronDown size={18} className="inline mr-2" /> Collapse
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}