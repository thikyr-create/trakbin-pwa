"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RouteBuilding } from './components/types';

interface MapboxMapProps {
  routeStops: RouteBuilding[];
}

const DEFAULT_CENTER: [number, number] = [3.3792, 6.5244];

export default function MapboxMap({ routeStops }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // 1. Initialize Map Once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: DEFAULT_CENTER,
      zoom: 15,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add GPS Dot
    const el = document.createElement('div');
    el.innerHTML = `<div style="width: 20px; height: 20px; background-color: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`;
    markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(DEFAULT_CENTER).addTo(mapRef.current);

    // Background GPS tracking
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          markerRef.current?.setLngLat([pos.coords.longitude, pos.coords.latitude]);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Draw Route Line and Nodes when stops update
  useEffect(() => {
    if (!mapRef.current || routeStops.length === 0) return;
    const map = mapRef.current;

    const drawRoute = () => {
      // Remove existing layers/sources if they exist
      if (map.getLayer('route-line-layer')) map.removeLayer('route-line-layer');
      if (map.getSource('route-line')) map.removeSource('route-line');
      if (map.getLayer('route-nodes-layer')) map.removeLayer('route-nodes-layer');
      if (map.getSource('route-nodes')) map.removeSource('route-nodes');

      // Sort stops by sequence
      const sortedStops = [...routeStops].sort((a, b) => a.sequence - b.sequence);
      
      // Create GeoJSON for the line
      const lineCoordinates: [number, number][] = sortedStops.map(stop => [stop.longitude!, stop.latitude!]);
      
      // Add Line Source & Layer
      map.addSource('route-line', {
        type: 'geojson',
        data: { 
          type: 'Feature', 
          properties: {}, 
          geometry: { type: 'LineString', coordinates: lineCoordinates } 
        }
      });

      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#16A34A', 'line-width': 6, 'line-opacity': 0.8 }
      });

      // Create GeoJSON for the nodes
      const nodesGeoJSON: any = {
        type: 'FeatureCollection',
        features: sortedStops.map(stop => ({
          type: 'Feature',
          properties: { 
            id: stop.building_id, 
            status: stop.status,
            payment: stop.payment_status 
          },
          geometry: { type: 'Point', coordinates: [stop.longitude!, stop.latitude!] }
        }))
      };

      // Add Nodes Source & Layer
      map.addSource('route-nodes', { type: 'geojson', data: nodesGeoJSON });

      map.addLayer({
        id: 'route-nodes-layer',
        type: 'circle',
        source: 'route-nodes',
        paint: {
          'circle-radius': 10,
          // ✅ UPDATED: Added amber color for skipped stops
          'circle-color': [
            'match',
            ['get', 'status'],
            'completed', '#9CA3AF', // Gray
            'skipped', '#F59E0B',   // Amber/Yellow for skipped
            'pending', [
              'match', ['get', 'payment'],
              'unpaid', '#EF4444', // Red
              '#10B981' // Green
            ],
            '#3B82F6' // Blue (Current/Arrived)
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // Fly to the first pending stop
      const firstPending = sortedStops.find(s => s.status === 'pending');
      if (firstPending) {
        map.flyTo({ center: [firstPending.longitude!, firstPending.latitude!], zoom: 16, duration: 2000 });
      }
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.on('load', drawRoute);
    }

  }, [routeStops]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}