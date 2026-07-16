"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
// @ts-ignore
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDriverSession } from '@/lib/store/useDriverSession';

const DEFAULT_CENTER: [number, number] = [3.3792, 6.5244];

export default function MapboxMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  
  // ✅ Read data directly from the Operational Engine
  const { routeStops, currentStop } = useDriverSession();

  // 1. Initialize Map Once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: DEFAULT_CENTER,
      zoom: 15, pitch: 0, bearing: 0, antialias: true,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const el = document.createElement('div');
    el.innerHTML = `<div style="width: 20px; height: 20px; background-color: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`;
    markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(DEFAULT_CENTER).addTo(mapRef.current);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // 2. Draw Route Line and Nodes when store updates
  useEffect(() => {
    if (!mapRef.current || routeStops.length === 0) return;
    const map = mapRef.current;

    const drawRoute = () => {
      if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
      if (map.getSource('route-line')) map.removeSource('route-line');
      if (map.getLayer('route-nodes-layer')) map.removeLayer('route-nodes-layer');
      if (map.getSource('route-nodes')) map.removeSource('route-nodes');

      const sortedStops = [...routeStops].sort((a, b) => a.sequence - b.sequence);
      const lineCoordinates: [number, number][] = sortedStops.filter(s => s.latitude && s.longitude).map(stop => [stop.longitude!, stop.latitude!]);
      
      if (lineCoordinates.length > 0) {
        map.addSource('route-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: lineCoordinates } } });
        map.addLayer({ id: 'route-line-layer', type: 'line', source: 'route-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#16A34A', 'line-width': 6, 'line-opacity': 0.8 } });
      }

      const nodesGeoJSON: any = { type: 'FeatureCollection', features: sortedStops.filter(s => s.latitude && s.longitude).map(stop => ({ type: 'Feature', properties: { id: stop.building_id, status: stop.status, payment: stop.payment_status }, geometry: { type: 'Point', coordinates: [stop.longitude!, stop.latitude!] } })) };
      map.addSource('route-nodes', { type: 'geojson', data: nodesGeoJSON });
      map.addLayer({ id: 'route-nodes-layer', type: 'circle', source: 'route-nodes', paint: { 'circle-radius': 10, 'circle-color': ['match', ['get', 'status'], 'completed', '#9CA3AF', 'skipped', '#F59E0B', 'pending', ['match', ['get', 'payment'], 'unpaid', '#EF4444', '#10B981'], '#3B82F6'], 'circle-stroke-width': 3, 'circle-stroke-color': '#FFFFFF' } });

      const firstPending = sortedStops.find(s => s.status === 'pending');
      if (firstPending && firstPending.latitude && firstPending.longitude) map.flyTo({ center: [firstPending.longitude, firstPending.latitude], zoom: 16, duration: 2000 });
    };

    if (map.isStyleLoaded()) drawRoute(); else map.on('load', drawRoute);
  }, [routeStops]);

  // 3. Fly to stop when currentStop changes in the store
  useEffect(() => {
    if (currentStop && currentStop.latitude && currentStop.longitude && mapRef.current) {
      mapRef.current.flyTo({ center: [currentStop.longitude, currentStop.latitude], zoom: 17, duration: 1500, essential: true });
    }
  }, [currentStop]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}