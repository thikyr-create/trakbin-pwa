// app/hauler-dashboard/components/map/ConsoleMapView.tsx
"use client";

import { useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import MapboxMap from '../../MapboxMap';
import MapControls from './MapControls';
import GpsChip from './GpsChip';

export default function ConsoleMapView() {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  return (
    <div className="absolute inset-0">
      <MapboxMap onMapReady={setMap} />
      <MapControls map={map} />
      <GpsChip />
    </div>
  );
}