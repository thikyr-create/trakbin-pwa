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
  const sheetVisible = !!currentStop && !isRoutePaused;

  return (
    <>
      <ConsoleMapView />

      {!route && (
        <div className="absolute top-[130px] inset-x-4 z-10 bg-white/95 backdrop-blur rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Package size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900">No route assigned</p>
            <p className="text-xs text-gray-500">
              You're off shift. When dispatch assigns a route, it appears here automatically.
            </p>
          </div>
        </div>
      )}

      <GpsChip className={sheetVisible ? 'bottom-[300px]' : 'bottom-24'} />
      <DeviationAlert />
      <BottomSheet />
    </>
  );
}