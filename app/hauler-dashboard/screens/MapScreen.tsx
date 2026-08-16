// app/hauler-dashboard/screens/MapScreen.tsx
"use client";

import ConsoleMapView from '../components/map/ConsoleMapView';
import BottomSheet from '../components/console/BottomSheet';
import DeviationAlert from '../components/DeviationAlert';
import GpsChip from '../components/map/GpsChip';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';

export default function MapScreen() {
  const { currentStop, isRoutePaused } = useDriverSession();
  const { sheetState } = useConsoleStore();

  // Position GPS chip just above the bottom sheet
  // When expanded: chip disappears (handled by GpsChip itself)
  // When collapsed active: sheet is 44px, so chip at bottom-[52px]
  // When off shift (no currentStop): sheet is 44px, chip at bottom-[52px]
  // When paused: sheet is 44px when collapsed, chip at bottom-[52px]
  const chipBottom = currentStop ? 'bottom-[52px]' : 'bottom-[52px]';

  return (
    <>
      <ConsoleMapView />
      <GpsChip className={chipBottom} />
      <DeviationAlert />
      <BottomSheet />
    </>
  );
}