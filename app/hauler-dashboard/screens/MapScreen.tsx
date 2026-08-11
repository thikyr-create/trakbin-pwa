// app/hauler-dashboard/screens/MapScreen.tsx
"use client";

import { Package } from 'lucide-react';
import ConsoleMapView from '../components/map/ConsoleMapView';
import BottomSheet from '../components/console/BottomSheet';
import DeviationAlert from '../components/DeviationAlert';
import GpsChip from '../components/map/GpsChip';
import { useDriverSession } from '@/lib/store/useDriverSession';

export default function MapScreen() {
  const { route, currentStop, isRoutePaused } = useDriverSession();
  const sheetVisible = !!currentStop;

  return (
    <>
      <ConsoleMapView />

      {!route && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-gray-200 flex items-center gap-2">
          <Package size={14} className="text-gray-500" />
          <p className="text-xs font-bold text-gray-600 whitespace-nowrap">No route assigned — off shift</p>
        </div>
      )}

      <GpsChip className={sheetVisible && !isRoutePaused ? 'bottom-[300px]' : 'bottom-6'} />
      <DeviationAlert />
      <BottomSheet />
    </>
  );
}