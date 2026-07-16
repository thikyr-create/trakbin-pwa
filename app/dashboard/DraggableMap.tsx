"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DraggableMapProps {
  coords: { lat: number; lon: number };
  onDragEnd: (lat: number, lon: number) => void;
}

export default function DraggableMap({ coords, onDragEnd }: DraggableMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    // Initialize Mapbox Map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Same premium style as hauler
      center: [coords.lon, coords.lat],
      zoom: 16,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // When user stops dragging the map, get the new center coordinates
    map.current.on('moveend', () => {
      if (map.current) {
        const center = map.current.getCenter();
        onDragEnd(center.lat, center.lng);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Initialize only once

  // If the GPS/Search updates the coords externally, fly the map there
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [coords.lon, coords.lat],
        zoom: 16,
        duration: 1500
      });
    }
  }, [coords.lat, coords.lon]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
      {/* The Mapbox Canvas */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      
      {/* The Center Pin (Stays in the middle while map moves) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none drop-shadow-lg">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#16A34A" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      
      {/* Instruction Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full z-10 pointer-events-none">
        Drag map to pinpoint location
      </div>
    </div>
  );
}