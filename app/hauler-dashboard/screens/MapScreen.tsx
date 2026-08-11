// app/hauler-dashboard/screens/MapScreen.tsx
"use client";

import ConsoleMapView from '../components/map/ConsoleMapView';
import BottomSheet from '../components/console/BottomSheet';
import DeviationAlert from '../components/DeviationAlert';
import GpsChip from '../components/map/GpsChip';
import { useDriverSession } from '@/lib/store/useDriverSession';

export default function MapScreen() {
  const { currentStop, isRoutePaused } = useDriverSession();

  return (
    <>
      <ConsoleMapView />
      <GpsChip className={currentStop ? (isRoutePaused ? 'bottom-[180px]' : 'bottom-[300px]') : 'bottom-[60px]'} />
      <DeviationAlert />
      <BottomSheet />
    </>
  );
}