// app/hauler-dashboard/screens/MapScreen.tsx
"use client";

import MapboxMap from '../MapboxMap';
import BottomSheet from '../components/console/BottomSheet';

export default function MapScreen() {
  return (
    <>
      <div className="absolute inset-0">
        <MapboxMap />
      </div>
      <BottomSheet />
    </>
  );
}