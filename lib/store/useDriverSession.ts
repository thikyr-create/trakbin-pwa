// lib/store/useDriverSession.ts
"use client";

import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { recordActivity, type DriverEventType } from '@/lib/features/driver/activity';
import { deviationDetector } from '@/lib/features/driver/deviation/deviationDetector';
import { breadcrumbRecorder } from '@/lib/features/driver/breadcrumbs/breadcrumbRecorder';
import { DriverRoute, RouteBuilding } from '../../app/hauler-dashboard/components/types';
import { calculateDistanceInMeters, calculateTotalDistanceKm } from '../../app/hauler-dashboard/utils/geo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface GeocodeResult {
  id: string;
  place_name: string;
  center: [number, number];
  type: 'building' | 'place';
  buildingId?: string;
}

export interface DriverSessionState {
  driver: any;
  driverCompanyId: number | null;
  route: DriverRoute | null;
  routeStops: RouteBuilding[];
  currentStop: RouteBuilding | null;
  isArrived: boolean;
  gpsLocation: { lat: number; lng: number } | null;
  gpsAccuracy: number | null;
  isLoading: boolean;
  progressStats: { distance: number; eta: number };
  isRoutePaused: boolean;
  showEndShiftModal: boolean;

  searchQuery: string;
  searchResults: RouteBuilding[];
  isSearchFocused: boolean;
  showSkipModal: boolean;
  showReportModal: boolean;
  geocodeResults: GeocodeResult[];

  cameraMode: 'following' | 'exploring' | 'navigating' | 'idle';
  highlightedNodeId: string | null;
  targetLocation: { lat: number; lng: number; zoom: number } | null;
  navigationDestination: { lat: number; lng: number } | null;

  initializeSession: () => void;
  startGpsTracking: () => void;
  stopGpsTracking: () => void;
  updateGps: (lat: number, lng: number, accuracy?: number) => void;
  completePickup: () => Promise<void>;
  skipStop: (reason: string) => Promise<void>;
  reportIssue: (issueType: string, description: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setIsSearchFocused: (focused: boolean) => void;
  selectSearchResult: (stop: RouteBuilding) => void;
  setShowSkipModal: (show: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  setShowEndShiftModal: (show: boolean) => void;
  setNavigationDestination: (dest: { lat: number; lng: number } | null) => void;
  searchGeocode: (query: string) => Promise<void>;
  selectGeocodeResult: (result: GeocodeResult) => void;
  toggleRoutePause: (reason?: string) => Promise<void>;
  endShift: () => Promise<void>;

  setCameraMode: (mode: 'following' | 'exploring' | 'navigating' | 'idle') => void;
  highlightNode: (id: string | null) => void;
  flyToLocation: (lat: number, lng: number, zoom: number) => void;
  centerOnDriver: () => void;
}

let gpsWatchId: number | null = null;
let routeStartRecorded = false;
let approachedFor: string | null = null;

export const useDriverSession = create<DriverSessionState>((set, get) => {
  // Activity recorder: uses the driver's OWN company_id (never the company session)
  const act = (eventType: DriverEventType, extra?: { buildingId?: string | null; metadata?: Record<string, unknown> }) => {
    const { driver, driverCompanyId, route, gpsLocation } = get();
    const { tenant } = useCompanySession.getState();
    const companyId = driverCompanyId ?? tenant.companyId;
    if (!companyId) {
      console.warn('[driver-act] no companyId available, skipping', eventType);
      return;
    }
    recordActivity({
      eventType,
      driverId: driver?.employee_id || driver?.id || 'unknown',
      companyId,
      routeId: route?.id ?? null,
      buildingId: extra?.buildingId ?? null,
      latitude: gpsLocation?.lat ?? null,
      longitude: gpsLocation?.lng ?? null,
      metadata: extra?.metadata ?? {},
    }).catch((e) => console.warn('[driver-act] record failed', eventType, e));
  };

  return ({
  driver: null,
  driverCompanyId: null,
  route: null,
  routeStops: [],
  currentStop: null,
  isArrived: false,
  gpsLocation: null,
  gpsAccuracy: null,
  isLoading: true,
  progressStats: { distance: 0, eta: 0 },
  isRoutePaused: false,
  showEndShiftModal: false,
  searchQuery: '',
  searchResults: [],
  isSearchFocused: false,
  showSkipModal: false,
  showReportModal: false,
  geocodeResults: [],
  cameraMode: 'idle',
  highlightedNodeId: null,
  targetLocation: null,
  navigationDestination: null,

  initializeSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/auth';
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const { data: driverRow } = await supabase.from('drivers').select('*').eq('user_id', user.id).maybeSingle();

    if (!profile && !driverRow) {
      console.error('Driver profile not found');
      window.location.href = '/auth';
      return;
    }

    const driver = driverRow ?? profile;
    const cid = Number(driverRow?.company_id ?? profile?.company_id ?? 0) || null;
    set({ driver, driverCompanyId: cid });

    set({ isLoading: true });
    try {
      console.log('[driver-console] auth uid:', user.id);
      console.log('[driver-console] driver row:', driver);
      console.log('[driver-console] querying routes:', { cid, driver_id: String(driver.id) });

      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', cid)
        .eq('driver_id', String(driver.id))
        .in('status', ['assigned', 'active', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('[driver-console] route query result:', { routeData, routeError });

      if (routeError || !routeData) {
        set({ route: null, routeStops: [], isLoading: false });
        return;
      }

      set({ route: routeData, isRoutePaused: routeData.status === 'paused' });

      // Load planned geometry for deviation detection
      deviationDetector.loadRouteGeometry(routeData.id).catch(() => {});

      const { data: stopsData } = await supabase
        .from('route_stops')
        .select('*')
        .eq('company_id', cid)
        .eq('route_id', routeData.id)
        .order('sequence', { ascending: true });

      if (!stopsData) { set({ routeStops: [], isLoading: false }); return; }

      const buildingIds = stopsData.map((stop: any) => stop.building_id);

      // Real columns only (lat/lng required for arrival geofence)
      const { data: buildingsData } = await supabase
        .from('Buildings')
        .select('custom_id, address, estate, building_type, number_of_units, unit_type, payment_status, latitude, longitude')
        .eq('company_id', cid)
        .in('custom_id', buildingIds);

      const mergedStops: RouteBuilding[] = stopsData.map((stop: any) => {
        const building = buildingsData?.find((b: any) => b.custom_id === stop.building_id);
        return {
          ...stop,
          status: stop.status as RouteBuilding['status'],
          address: building?.address,
          estate: building?.estate,
          building_type: building?.building_type,
          number_of_units: building?.number_of_units,
          unit_type: building?.unit_type,
          latitude: building?.latitude != null ? Number(building.latitude) : undefined,
          longitude: building?.longitude != null ? Number(building.longitude) : undefined,
          payment_status: building?.payment_status,
        } as any;
      });

      set({ routeStops: mergedStops, currentStop: mergedStops.find((s: any) => s.status === 'pending') || null, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  startGpsTracking: () => {
    if (!navigator.geolocation) return;
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => get().updateGps(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  },

  stopGpsTracking: () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
  },

  updateGps: (lat, lng, accuracy?) => {
    set({ gpsLocation: { lat, lng }, gpsAccuracy: accuracy ?? null });
    const { currentStop, isArrived, isRoutePaused, route, driverCompanyId, driver } = get();
    const { tenant } = useCompanySession.getState();
    const cid = driverCompanyId ?? tenant.companyId;

    // ─── BREADCRUMB RECORDING ───
    // Record continuous GPS track while actively on a route
    if (cid && route && driver) {
      breadcrumbRecorder.record({
        driverId: driver.employee_id || driver.id || 'unknown',
        companyId: cid,
        routeId: route.id,
        lat,
        lng,
        accuracy,
        speed: null, // Mobile GPS speed is often null/unreliable; FI calculates it from points
        heading: null,
      });
    }

    // Route start: first GPS lock on an assigned route
    if (route && route.status === 'assigned' && cid && !routeStartRecorded) {
      routeStartRecorded = true;
      (async () => {
        try {
          await supabase.from('routes').update({ status: 'active' }).eq('id', route.id);
          set({ route: { ...route, status: 'active' as any } });
          act('DRIVER_ROUTE_STARTED', {});
        } catch {}
      })();
    }

    // Deviation detection (only while actively on route)
    if (route && route.status === 'active' && !isRoutePaused) {
      deviationDetector.checkDeviation(lat, lng);
    }

    if (isRoutePaused || !currentStop || !currentStop.latitude || !currentStop.longitude) return;

    const distance = calculateDistanceInMeters(lat, lng, currentStop.latitude, currentStop.longitude);

    // Approaching band (150m → 25m), once per stop
    if (distance <= 150 && distance > 25 && approachedFor !== currentStop.id) {
      approachedFor = currentStop.id;
      act('DRIVER_STOP_APPROACHED', { buildingId: currentStop.building_id, metadata: { distanceM: Math.round(distance) } });
    }

    if (distance <= 25 && !isArrived) {
      set({ isArrived: true });
      act('DRIVER_STOP_ARRIVED', { buildingId: currentStop.building_id, metadata: { distanceM: Math.round(distance) } });
    } else if (distance > 50 && isArrived) {
      set({ isArrived: false });
    }
  },

  completePickup: async () => {
    const { currentStop, route, routeStops } = get();
    const { tenant } = useCompanySession.getState();
    const { driverCompanyId } = get();
    const cid = driverCompanyId ?? tenant.companyId;
    if (!currentStop || !route || !cid) return;

    console.log('[driver] completePickup, company=', cid, 'stop=', currentStop?.building_id);
    act('DRIVER_PICKUP_CONFIRMED', { buildingId: currentStop.building_id });

    const newStops = routeStops.map(s => s.id === currentStop.id ? { ...s, status: 'completed' as RouteBuilding['status'] } : s);
    const nextStop = newStops.find(s => s.sequence === currentStop.sequence + 1 && s.status === 'pending') || null;
    const newRoute = { ...route, completed_stops: route.completed_stops + 1 };

    // Clear navigation destination so the blue routing line disappears
    set({ routeStops: newStops, currentStop: nextStop, route: newRoute, isArrived: false, navigationDestination: null });
    approachedFor = null;

    await supabase.from('route_stops').update({ status: 'completed', completion_time: new Date().toISOString() }).eq('id', currentStop.id).eq('company_id', cid);
    await supabase.from('routes').update({ completed_stops: newRoute.completed_stops }).eq('id', route.id).eq('company_id', cid);

    const skippedCount = newStops.filter(s => s.status === 'skipped').length;
    if (newRoute.completed_stops + skippedCount >= newRoute.total_stops) {
      await get().endShift();
    }
  },

  skipStop: async (reason: string) => {
    const { currentStop, routeStops, driverCompanyId } = get();
    const { tenant } = useCompanySession.getState();
    const cid = driverCompanyId ?? tenant.companyId;
    if (!currentStop || !cid) return;

    console.log('[driver] skipStop, company=', cid, 'stop=', currentStop?.building_id);
    act('DRIVER_PICKUP_SKIPPED', { buildingId: currentStop.building_id, metadata: { reason } });

    const newStops = routeStops.map(s => s.id === currentStop.id ? { ...s, status: 'skipped' as RouteBuilding['status'], skip_reason: reason } : s);
    const nextStop = newStops.find(s => s.sequence === currentStop.sequence + 1 && s.status === 'pending') || null;

    // Clear navigation destination so the blue routing line disappears
    set({ routeStops: newStops, currentStop: nextStop, isArrived: false, showSkipModal: false, navigationDestination: null });
    approachedFor = null;

    await supabase.from('route_stops').update({ status: 'skipped', skip_reason: reason }).eq('id', currentStop.id).eq('company_id', cid);
  },

  reportIssue: async (issueType: string, description: string) => {
    const { currentStop, driver, gpsLocation, driverCompanyId } = get();
    const { tenant } = useCompanySession.getState();
    const cid = driverCompanyId ?? tenant.companyId;
    if (!cid) return;

    const { error } = await supabase.from('environmental_issues').insert([{
      issue_type: issueType,
      severity: 'Medium',
      description: description || null,
      status: 'pending',
      building_id: currentStop?.building_id ?? null,
      reported_by: driver?.employee_id || driver?.id || 'driver',
      company_id: cid,
      latitude: gpsLocation?.lat ?? null,
      longitude: gpsLocation?.lng ?? null,
    }]);

    if (!error) {
      act('DRIVER_FEEDBACK_SUBMITTED', { buildingId: currentStop?.building_id ?? null, metadata: { category: issueType } });
    }
    set({ showReportModal: false });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (!query.trim()) { set({ searchResults: [], geocodeResults: [] }); return; }
    const { routeStops } = get();
    const filtered = routeStops.filter(stop => stop.building_id.toLowerCase().includes(query.toLowerCase()) || (stop.address || '').toLowerCase().includes(query.toLowerCase()));
    set({ searchResults: filtered });
  },

  setIsSearchFocused: (focused) => set({ isSearchFocused: focused }),

  selectSearchResult: (stop) => {
    set({ searchQuery: stop.address || stop.building_id, isSearchFocused: false, geocodeResults: [] });
    if (stop.latitude && stop.longitude) {
      set({ targetLocation: { lat: stop.latitude, lng: stop.longitude, zoom: 17 }, cameraMode: 'navigating' });
    }
  },

  setShowSkipModal: (show) => set({ showSkipModal: show }),
  setShowReportModal: (show) => set({ showReportModal: show }),
  setShowEndShiftModal: (show) => set({ showEndShiftModal: show }),
  
  setNavigationDestination: (dest) => set({ navigationDestination: dest }),

  searchGeocode: async (query) => {
    if (!query.trim()) { set({ geocodeResults: [] }); return; }
    const { routeStops } = get();
    const results: GeocodeResult[] = [];

    const buildingMatches = routeStops.filter(stop =>
      stop.building_id.toLowerCase().includes(query.toLowerCase()) ||
      (stop.address || '').toLowerCase().includes(query.toLowerCase())
    );

    buildingMatches.forEach(stop => {
      if (stop.latitude && stop.longitude) {
        results.push({ id: `building-${stop.id}`, place_name: `${stop.building_id} - ${stop.address}`, center: [stop.longitude, stop.latitude], type: 'building', buildingId: stop.building_id });
      }
    });

    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=5`);
      const data = await response.json();
      if (data.features) {
        data.features.forEach((feature: any) => {
          results.push({ id: `place-${feature.id}`, place_name: feature.place_name, center: feature.center, type: 'place' });
        });
      }
    } catch (error) { console.error('Geocoding error:', error); }

    set({ geocodeResults: results });
  },

  selectGeocodeResult: (result) => {
    set({ geocodeResults: [], searchQuery: result.place_name, isSearchFocused: false });
    if (result.type === 'building') {
      const building = get().routeStops.find(s => s.building_id === result.buildingId);
      if (building) get().selectSearchResult(building);
    } else {
      get().flyToLocation(result.center[1], result.center[0], 16);
    }
  },

  toggleRoutePause: async (reason?: string) => {
    const { isRoutePaused, route, driverCompanyId } = get();
    const { tenant } = useCompanySession.getState();
    const cid = driverCompanyId ?? tenant.companyId;
    const newPauseState = !isRoutePaused;

    set({ isRoutePaused: newPauseState });
    act(
      newPauseState ? 'DRIVER_ROUTE_PAUSED' : 'DRIVER_ROUTE_RESUMED',
      reason ? { metadata: { reason } } : {}
    );

    if (route && cid) {
      try {
        await supabase.from('routes').update({ status: newPauseState ? 'paused' : 'active' }).eq('id', route.id).eq('company_id', cid);
      } catch (error) {
        console.error('Error updating route status:', error);
      }
    }
  },

  endShift: async () => {
    const { route, stopGpsTracking, driverCompanyId } = get();
    const { tenant } = useCompanySession.getState();
    const cid = driverCompanyId ?? tenant.companyId;

    if (!route || !cid) return;

    console.log('[driver] endShift, company=', cid, 'route=', route?.id);
    act('DRIVER_ROUTE_COMPLETED', {});
    deviationDetector.reset();

    try {
      await supabase.from('routes').update({
        status: 'completed',
        ended_at: new Date().toISOString()
      }).eq('id', route.id).eq('company_id', cid);

      // Close the work order and release driver + truck back to the available pool
      await supabase.from('assignments').update({ status: 'completed' }).eq('route_id', route.id).eq('company_id', cid);
      await supabase.from('drivers').update({ status: 'available', current_assignment_id: null }).eq('id', Number(route.driver_id));
      await supabase.from('trucks').update({ status: 'available', current_driver: null }).eq('id', Number(route.truck_id));

      // ─── BREADCRUMB FLUSH ───
      // Ensure the final batch of GPS points is sent before stopping tracking
      await breadcrumbRecorder.flush();
      stopGpsTracking();

      set({
        route: null,
        routeStops: [],
        currentStop: null,
        isArrived: false,
        isRoutePaused: false,
        showEndShiftModal: false,
        progressStats: { distance: 0, eta: 0 },
        navigationDestination: null
      });
    } catch (error) {
      console.error('Error ending shift:', error);
      alert('Error ending shift. Please try again.');
    }
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  highlightNode: (id) => set({ highlightedNodeId: id }),
  flyToLocation: (lat, lng, zoom) => set({ targetLocation: { lat, lng, zoom }, cameraMode: 'navigating' }),
  centerOnDriver: () => set({ cameraMode: 'following' }),
});
});