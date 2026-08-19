// app/hauler-dashboard/MapboxMap.tsx
"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
// @ts-ignore
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';

const supabase = supabaseBrowser;

const PLACEHOLDER_CENTER: [number, number] = [9.0, 8.0];
const MAX_USABLE_ACCURACY_M = 1000;

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
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const centeredRef = useRef(false);

  const { routeStops, cameraMode, targetLocation, gpsLocation, gpsAccuracy, highlightedNodeId, navigationDestination } = useDriverSession();
  const { searchDestination } = useConsoleStore();

  const gpsUsable = !!gpsLocation && gpsAccuracy != null && gpsAccuracy <= MAX_USABLE_ACCURACY_M;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: PLACEHOLDER_CENTER,
      zoom: 5,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    mapRef.current = map;

    map.on('style.load', () => drawRouteRef.current());

    if (onMapReady) onMapReady(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !gpsLocation || !gpsUsable) return;
    const lngLat: [number, number] = [gpsLocation.lng, gpsLocation.lat];

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width: 20px; height: 20px; background-color: #3B82F6; border: 3px solid white; border-radius:50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`;
      markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
      if (!centeredRef.current) {
        centeredRef.current = true;
        map.flyTo({ center: lngLat, zoom: 17, duration: 1200 });
      }
    } else {
      markerRef.current.setLngLat(lngLat);
      if (cameraMode === 'following') {
        map.flyTo({ center: lngLat, zoom: 17, duration: 800 });
      }
    }
  }, [gpsLocation, gpsUsable, cameraMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || centeredRef.current || gpsUsable || routeStops.length > 0) return;
    const { driverCompanyId } = useDriverSession.getState();
    if (!driverCompanyId) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('Buildings')
        .select('latitude, longitude')
        .eq('company_id', driverCompanyId)
        .not('latitude', 'is', null)
        .limit(200);
      if (cancelled || centeredRef.current || !data?.length) return;
      const pts = data.filter((b: any) => b.latitude != null && b.longitude != null);
      if (!pts.length) return;
      const lat = pts.reduce((s: number, b: any) => s + Number(b.latitude), 0) / pts.length;
      const lng = pts.reduce((s: number, b: any) => s + Number(b.longitude), 0) / pts.length;
      centeredRef.current = true;
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1500 });
    })();
    return () => { cancelled = true; };
  }, [gpsUsable, routeStops.length]);

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

  // Search destination routing (existing)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clear = () => {
      if (map.getLayer('search-route-layer')) map.removeLayer('search-route-layer');
      if (map.getSource('search-route')) map.removeSource('search-route');
      if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null; }
    };

    if (!searchDestination) { clear(); return; }

    const state = useDriverSession.getState();
    const origin: [number, number] =
      state.gpsLocation && state.gpsAccuracy != null && state.gpsAccuracy <= MAX_USABLE_ACCURACY_M
        ? [state.gpsLocation.lng, state.gpsLocation.lat]
        : (map.getCenter().toArray() as [number, number]);

    let cancelled = false;
    (async () => {
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${searchDestination.lng},${searchDestination.lat}` +
          `?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled || !mapRef.current) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        clear();
        if (!coords || coords.length < 2) return;

        map.addSource('search-route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'search-route-layer',
          type: 'line',
          source: 'search-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#2563EB', 'line-width': 5, 'line-opacity': 0.9 },
        });

        const el = document.createElement('div');
        el.innerHTML = `<div style="width:16px;height:16px;background:#2563EB;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.4);"></div>`;
        destMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([searchDestination.lng, searchDestination.lat])
          .addTo(map);

        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach((c: [number, number]) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 70, duration: 1200 });
      } catch (e) {
        console.warn('[search-route] directions failed', e);
      }
    })();

    return () => { cancelled = true; };
  }, [searchDestination]);

  // NEW: Navigation destination routing (blue line from driver to next stop)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clear = () => {
      if (map.getLayer('nav-route-layer')) map.removeLayer('nav-route-layer');
      if (map.getSource('nav-route')) map.removeSource('nav-route');
    };

    if (!navigationDestination) { clear(); return; }

    const state = useDriverSession.getState();
    if (!state.gpsLocation || state.gpsAccuracy == null || state.gpsAccuracy > MAX_USABLE_ACCURACY_M) {
      clear();
      return;
    }

    const origin: [number, number] = [state.gpsLocation.lng, state.gpsLocation.lat];
    const dest: [number, number] = [navigationDestination.lng, navigationDestination.lat];

    let cancelled = false;
    (async () => {
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}` +
          `?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled || !mapRef.current) return;
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        clear();
        if (!coords || coords.length < 2) return;

        map.addSource('nav-route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'nav-route-layer',
          type: 'line',
          source: 'nav-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#2563EB', 'line-width': 5, 'line-opacity': 0.9 },
        });

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(origin);
        coords.forEach((c: [number, number]) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 70, duration: 1200 });
      } catch (e) {
        console.warn('[nav-route] directions failed', e);
      }
    })();

    return () => { cancelled = true; clear(); };
  }, [navigationDestination]);

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
    if (firstPending?.latitude && firstPending?.longitude && cameraMode === 'idle' && !centeredRef.current) {
      centeredRef.current = true;
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

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}