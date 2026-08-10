// app/hauler-dashboard/screens/MapScreen.tsx
"use client";

import ConsoleMapView from '../components/map/ConsoleMapView';
import BottomSheet from '../components/console/BottomSheet';
import DeviationAlert from '../components/DeviationAlert';

export default function MapScreen() {
  return (
    <>
      <ConsoleMapView />
      <DeviationAlert />
      <BottomSheet />
    </>
  );
}