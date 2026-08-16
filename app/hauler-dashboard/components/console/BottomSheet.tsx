// app/hauler-dashboard/components/console/BottomSheet.tsx
"use client";

import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Camera, SkipForward, Flag, MapPin, Package, DollarSign, Building2, Pause, Play } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { calculateDistanceInMeters } from '../../utils/geo';
import NextStopCard from './NextStopCard';

const VISIBLE_ACTIVE = 272;
const VISIBLE_IDLE = 44;

export default function BottomSheet() {
  const {
    currentStop, isArrived, isRoutePaused, gpsLocation,
    completePickup, setShowSkipModal, setShowReportModal, toggleRoutePause,
    flyToLocation,
  } = useDriverSession();
  const { sheetState, setSheetState, openEvidence, setPauseModalOpen } = useConsoleStore();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [collapsedY, setCollapsedY] = useState(300);

  const mode: 'idle' | 'paused' | 'active' = !currentStop ? 'idle' : isRoutePaused ? 'paused' : 'active';
  const visiblePx = mode === 'active' ? VISIBLE_ACTIVE : mode === 'idle' ? VISIBLE_IDLE : 9999;

  useLayoutEffect(() => {
    const h = sheetRef.current?.offsetHeight ?? 0;
    if (h > 0) setCollapsedY(Math.max(0, h - visiblePx));
  }, [currentStop?.id, sheetState, mode, visiblePx]);

  const stop: any = currentStop;
  const distanceM =
    gpsLocation && stop?.latitude != null && stop?.longitude != null
      ? calculateDistanceInMeters(gpsLocation.lat, gpsLocation.lng, stop.latitude, stop.longitude)
      : null;
  const etaMin = distanceM != null ? Math.max(1, Math.round((distanceM / 1000 / 25) * 60)) : null;

  const onDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    const fastUp = info.velocity.y < -500;
    const fastDown = info.velocity.y > 500;
    const movedUp = info.offset.y < -60;
    const movedDown = info.offset.y > 60;
    if (fastUp || (movedUp && !fastDown)) setSheetState('expanded');
    else if (fastDown || (movedDown && !fastUp)) setSheetState('collapsed');
  };

  // FIX 3: Manual collapse/expand anytime via tap on the handle
  const toggleSheet = () => {
    setSheetState(sheetState === 'expanded' ? 'collapsed' : 'expanded');
  };

  // FIX 1: In-app navigation + auto-collapse
  const handleNavigate = () => {
    if (!stop || stop.latitude == null || stop.longitude == null) return;
    flyToLocation(stop.latitude, stop.longitude, 17);
    setSheetState('collapsed');
  };

  const handleConfirm = async () => {
    const buildingId = stop.building_id;
    await completePickup();
    openEvidence('pickup', buildingId, `Pickup at ${buildingId}`);
  };

  return (
    <motion.div
      ref={sheetRef}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={onDragEnd}
      initial={false}
      animate={{ y: sheetState === 'collapsed' ? collapsedY : 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-200 will-change-transform"
    >
      {/* FIX 3: Drag handle — tap to collapse/expand anytime */}
      <motion.div
        onTap={toggleSheet}
        className="w-full flex justify-center pt-3 pb-2 cursor-pointer"
        title={sheetState === 'expanded' ? 'Tap to collapse' : 'Tap to expand'}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </motion.div>

      <div
        className="px-5 pb-5 overflow-y-auto max-h-[58vh]"
        onPointerDown={sheetState === 'expanded' ? (e) => e.stopPropagation() : undefined}
      >
        {mode === 'idle' && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
            <div>
              <p className="text-sm font-black text-gray-800">Off shift</p>
              <p className="text-xs text-gray-500">No active stop. Your next stop appears here when dispatch assigns a route.</p>
            </div>
          </div>
        )}

        {mode === 'paused' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
              <Pause size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-black text-amber-800">Route paused</p>
                <p className="text-xs text-amber-600">Progress preserved— stops won't be marked late.</p>
              </div>
            </div>
            <button
              onClick={() => toggleRoutePause()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
            >
              <Play size={16} /> Resume Route
            </button>
          </div>
        )}

        {mode === 'active' && currentStop && (
          <>
            <NextStopCard
              stop={currentStop}
              isArrived={isArrived}
              distanceM={distanceM}
              etaMin={etaMin}
              onNavigate={handleNavigate}
              onConfirm={handleConfirm}
              onSkip={() => setShowSkipModal(true)}
            />
            <button
              onClick={() => setPauseModalOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
            >
              <Pause size={16} /> Pause Route
            </button>
          </>
        )}

        {sheetState === 'expanded' && mode === 'active' && (
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