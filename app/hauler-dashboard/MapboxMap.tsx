// app/hauler-dashboard/MapboxMap.tsx
"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
// @ts-ignore
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDriverSession } from '@/lib/store/useDriverSession';

const DEFAULT_CENTER: [number, number] = [3.3792, 6.5244];

function stopMarkerEl(stop: any, isNext: boolean): HTMLDivElement {
  const el = document.createElement('div');
  const bg = stop.status === 'completed' ? '#9CA3AF' : stop.status === 'skipped' ? '#F59E0B' : '#059669';
  const size = isNext ? 34 : 26;
  el.style.cssText =
    `width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;` +
    `display:flex;align-items:center;justify-content:center;font-weight:800;` +
    `font-size:${isNext ? 14 : 11}px;border:2px solid #fff;` +
    `box-shadow:${isNext ? '0 0 0 6px rgba(5,150,105,0.3), 0 2px 8px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.35)'};` +
    `cursor:pointer;`;
  el.textContent = String(stop.sequence ?? '');
  return el;
}

export default function MapboxMap({ onMapReady }: { onMapReady?: (map: mapboxgl.Map) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const { routeStops, cameraMode, targetLocation, gpsLocation, highlightedNodeId } = useDriverSession();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: DEFAULT_CENTER,
      zoom: 15,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    mapRef.current = map;

    const el = document.createElement('div');
    el.innerHTML = `<div style="width: 20px; height: 20px; background-color: #3B82F6; border: 3px solid white; border-radius:50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`;
    markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(DEFAULT_CENTER).addTo(map);

    // Layers die on style switch → redraw after every style load
    map.on('style.load', () => drawRouteRef.current());

    if (onMapReady) onMapReady(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Recalculate canvas when the visible viewport changes (Safari chrome, orientation)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const resize = () => map.resize();
    const onOrientation = () => setTimeout(resize, 150);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    window.addEventListener('orientationchange', onOrientation);
    window.addEventListener('resize', resize);
    return () => {
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', onOrientation);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const drawRoute = () => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
    if (map.getSource('route-line')) map.removeSource('route-line');

    const sortedStops = [...routeStops].sort((a, b) => a.sequence - b.sequence);
    const lineCoordinates: [number, number][] = sortedStops
      .filter((s) => s.latitude && s.longitude)
      .map((stop) => [stop.longitude!, stop.latitude!]);

    if (lineCoordinates.length > 0) {
      map.addSource('route-line', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lineCoordinates } },
      });
      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#16A34A', 'line-width': 6, 'line-opacity': 0.8 },
      });
    }

    // Numbered DOM markers (survive style switches)
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];
    const nextId = sortedStops.find((s) => s.status === 'pending')?.id;

    sortedStops
      .filter((s) => s.latitude && s.longitude)
      .forEach((stop) => {
        const isNext = stop.id === nextId || highlightedNodeId === stop.id;
        const m = new mapboxgl.Marker({ element: stopMarkerEl(stop, isNext) })
          .setLngLat([stop.longitude!, stop.latitude!])
          .addTo(map);
        m.getElement()?.addEventListener('click', () => {
          map.flyTo({ center: [stop.longitude!, stop.latitude!], zoom: 17, duration: 1200 });
        });
        stopMarkersRef.current.push(m);
      });

    const firstPending = sortedStops.find((s) => s.status === 'pending');
    if (firstPending?.latitude && firstPending?.longitude && cameraMode === 'idle') {
      map.flyTo({ center: [firstPending.longitude, firstPending.latitude], zoom: 16, duration: 2000 });
    }
  };

  const drawRouteRef = useRef(drawRoute);
  drawRouteRef.current = drawRoute;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || routeStops.length === 0) return;
    if (map.isStyleLoaded()) drawRoute();
    else map.on('load', drawRoute);
  }, [routeStops, highlightedNodeId, cameraMode]);

  useEffect(() => {
    if (targetLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [targetLocation.lng, targetLocation.lat], zoom: targetLocation.zoom, duration: 1500, essential: true });
    }
  }, [targetLocation]);

  useEffect(() => {
    if (cameraMode === 'following' && gpsLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [gpsLocation.lng, gpsLocation.lat], zoom: 17, duration: 1000 });
    }
  }, [cameraMode, gpsLocation]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}