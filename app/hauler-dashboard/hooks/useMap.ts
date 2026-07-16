import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_CONFIG } from '../utils/constants';
import { createTruckMarkerElement, addMapStyles } from '../utils/mapHelpers';
import { DriverLocation } from '../components/types';

export const useMap = (driverLocation: DriverLocation | null) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    addMapStyles();

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('load', () => {
      setIsMapLoaded(true);
      
      // Create initial truck marker
      const markerElement = createTruckMarkerElement(0);
      markerRef.current = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(MAP_CONFIG.defaultCenter)
        .addTo(mapRef.current!);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when GPS updates
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !driverLocation) return;

    const { latitude, longitude, heading } = driverLocation;
    
    // Update marker position with animation
    markerRef.current.setLngLat([longitude, latitude]);
    
    // Rotate marker if heading is available
    if (heading !== null && heading !== undefined) {
      const markerElement = markerRef.current.getElement();
      const svg = markerElement.querySelector('svg');
      if (svg) {
        svg.style.transform = `rotate(${heading}deg)`;
      }
    }

    // Smoothly fly to new position (only if user hasn't moved the map)
    if (mapRef.current.getZoom() > 14) {
      mapRef.current.easeTo({
        center: [longitude, latitude],
        duration: 1000,
        easing: (n) => n,
      });
    }
  }, [driverLocation]);

  return { mapContainerRef, map: mapRef.current, isMapLoaded };
};