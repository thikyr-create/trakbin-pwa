import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { startGpsWatch, stopGpsWatch, calculateDistanceMeters, requestLocationPermission, GpsPosition } from '../services/location';
import { recordActivity } from '../services/activity';
import { breadcrumbRecorder } from '../services/breadcrumbs';
import { deviationDetector } from '../services/deviation';

const SNAPSHOT_KEY = 'trakbin_snapshot_driver';

// Module-level, mirrors PWA (web reload ≈ app session; reset on shift boundaries)
let approachedFor: string | null = null;
let routeStartRecorded = false;

export interface SessionState {
  driver: any;
  driverCompanyId: number | null;
  route: any;
  routeStops: any[];
  currentStop: any;
  isLoading: boolean;
  gpsLocation: GpsPosition | null;
  gpsAccuracy: number | null;
  isArrived: boolean;
  isRoutePaused: boolean;

  initializeSession: () => Promise<void>;
  resetSession: () => void;
  startGpsTracking: () => Promise<void>;
  stopGpsTracking: () => void;
  updateGps: (pos: GpsPosition) => void;
  completePickup: () => Promise<void>;
  skipStop: (reason: string) => Promise<void>;
  reportIssue: (issueType: string, description: string) => Promise<void>;
  toggleRoutePause: (reason?: string) => Promise<void>;
  endShift: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  driver: null,
  driverCompanyId: null,
  route: null,
  routeStops: [],
  currentStop: null,
  isLoading: true,
  gpsLocation: null,
  gpsAccuracy: null,
  isArrived: false,
  isRoutePaused: false,

  initializeSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    // SWR: paint last-known session instantly; network reconciles below
    const snapStr = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (snapStr) {
      try {
        const snap = JSON.parse(snapStr);
        set({ ...snap, isLoading: false });
      } catch {}
    }

    const { data: driver } = await supabase.from('drivers').select('*').eq('user_id', user.id).maybeSingle();
    if (!driver) { set({ isLoading: false }); return; }

    const cid = Number(driver.company_id) || null;
    set({ driver, driverCompanyId: cid, isLoading: true });

    try {
      const { data: route } = await supabase
        .from('routes')
        .select('*')
        .eq('company_id', cid)
        .eq('driver_id', String(driver.id))
        .in('status', ['assigned', 'active', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!route) {
        set({ route: null, routeStops: [], currentStop: null, isLoading: false });
        await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ driver, driverCompanyId: cid, route: null, routeStops: [], currentStop: null }));
        return;
      }

      set({ route, isRoutePaused: route.status === 'paused' });

      // Load planned geometry for deviation detection
      deviationDetector.loadRouteGeometry(route.id).catch(() => {});

      const { data: stopsData } = await supabase
        .from('route_stops')
        .select('*')
        .eq('company_id', cid)
        .eq('route_id', route.id)
        .order('sequence', { ascending: true });

      if (!stopsData) { set({ routeStops: [], isLoading: false }); return; }

      const buildingIds = stopsData.map((stop: any) => stop.building_id);
      const { data: buildings } = await supabase
        .from('Buildings')
        .select('custom_id, address, estate, building_type, number_of_units, unit_type, payment_status, latitude, longitude')
        .eq('company_id', cid)
        .in('custom_id', buildingIds);

      const mergedStops = stopsData.map((stop: any) => {
        const b = buildings?.find((x: any) => x.custom_id === stop.building_id);
        return {
          ...stop,
          address: b?.address,
          estate: b?.estate,
          building_type: b?.building_type,
          number_of_units: b?.number_of_units,
          unit_type: b?.unit_type,
          payment_status: b?.payment_status,
          latitude: b?.latitude != null ? Number(b.latitude) : undefined,
          longitude: b?.longitude != null ? Number(b.longitude) : undefined,
        };
      });

      const currentStop = mergedStops.find((s: any) => s.status === 'pending') || null;
      set({ routeStops: mergedStops, currentStop, isLoading: false });
      await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ driver, driverCompanyId: cid, route, routeStops: mergedStops, currentStop }));
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  resetSession: () => {
    set({ driver: null, driverCompanyId: null, route: null, routeStops: [], currentStop: null, isLoading: false, gpsLocation: null, gpsAccuracy: null, isArrived: false, isRoutePaused: false });
  },

  startGpsTracking: async () => {
    const ok = await requestLocationPermission();
    if (!ok) return;
    await startGpsWatch((pos) => get().updateGps(pos));
  },

  stopGpsTracking: () => {
    stopGpsWatch();
  },

  updateGps: (pos) => {
    set({ gpsLocation: pos, gpsAccuracy: pos.accuracy });
    const { currentStop, isArrived, isRoutePaused, route, driverCompanyId, driver } = get();
    const cid = driverCompanyId;

    // ─── BREADCRUMB RECORDING ───
    if (cid && route && driver) {
      breadcrumbRecorder.record({
        driverId: driver.employee_id || driver.id || 'unknown',
        companyId: cid,
        routeId: route.id,
        lat: pos.latitude,
        lng: pos.longitude,
        accuracy: pos.accuracy,
        speed: null,
        heading: null,
      });
    }

    const act = (eventType: Parameters<typeof recordActivity>[0]['eventType'], extra?: { buildingId?: string | null; metadata?: Record<string, unknown> }) => {
      if (!cid || !driver) return;
      recordActivity({
        eventType,
        driverId: driver?.employee_id || driver?.id || 'unknown',
        companyId: cid,
        routeId: route?.id ?? null,
        buildingId: extra?.buildingId ?? null,
        latitude: pos.latitude,
        longitude: pos.longitude,
        metadata: extra?.metadata ?? {},
      }).catch(() => {});
    };

    // Route start: first GPS lock on an assigned route
    if (route && route.status === 'assigned' && cid && !routeStartRecorded) {
      routeStartRecorded = true;
      (async () => {
        try {
          await supabase.from('routes').update({ status: 'active' }).eq('id', route.id);
          set({ route: { ...route, status: 'active' } });
          act('DRIVER_ROUTE_STARTED', {});
        } catch {}
      })();
    }

    // Deviation detection (only while actively on route)
    // Deviation detection (only while actively on route)
if (route && route.status === 'active' && !isRoutePaused) {
  deviationDetector.checkDeviation(pos.latitude, pos.longitude, { driver, route, companyId: cid });
}

    if (isRoutePaused || !currentStop || !currentStop.latitude || !currentStop.longitude) return;

    const distance = calculateDistanceMeters(pos.latitude, pos.longitude, currentStop.latitude, currentStop.longitude);

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
    const { currentStop, route, routeStops, driverCompanyId } = get();
    const cid = driverCompanyId;
    if (!currentStop || !route || !cid) return;

    const act = (eventType: Parameters<typeof recordActivity>[0]['eventType'], extra?: any) => {
      const { driver } = get();
      recordActivity({
        eventType,
        driverId: driver?.employee_id || driver?.id || 'unknown',
        companyId: cid,
        routeId: route.id,
        buildingId: extra?.buildingId ?? null,
        latitude: get().gpsLocation?.latitude ?? null,
        longitude: get().gpsLocation?.longitude ?? null,
        metadata: extra?.metadata ?? {},
      }).catch(() => {});
    };

    act('DRIVER_PICKUP_CONFIRMED', { buildingId: currentStop.building_id });

    const newStops = routeStops.map((s: any) => s.id === currentStop.id ? { ...s, status: 'completed' } : s);
    const nextStop = newStops.find((s: any) => s.sequence === currentStop.sequence + 1 && s.status === 'pending') || null;
    const newRoute = { ...route, completed_stops: route.completed_stops + 1 };

    set({ routeStops: newStops, currentStop: nextStop, route: newRoute, isArrived: false });
    approachedFor = null;

    await supabase.from('route_stops').update({ status: 'completed', completion_time: new Date().toISOString() }).eq('id', currentStop.id).eq('company_id', cid);
    await supabase.from('routes').update({ completed_stops: newRoute.completed_stops }).eq('id', route.id).eq('company_id', cid);

    const skippedCount = newStops.filter((s: any) => s.status === 'skipped').length;
    if (newRoute.completed_stops + skippedCount >= newRoute.total_stops) {
      await get().endShift();
    }
  },

  skipStop: async (reason: string) => {
    const { currentStop, routeStops, driverCompanyId, driver, gpsLocation, route } = get();
    const cid = driverCompanyId;
    if (!currentStop || !cid) return;

    recordActivity({
      eventType: 'DRIVER_PICKUP_SKIPPED',
      driverId: driver?.employee_id || driver?.id || 'unknown',
      companyId: cid,
      routeId: route?.id ?? null,
      buildingId: currentStop.building_id,
      latitude: gpsLocation?.latitude ?? null,
      longitude: gpsLocation?.longitude ?? null,
      metadata: { reason },
    }).catch(() => {});

    const newStops = routeStops.map((s: any) => s.id === currentStop.id ? { ...s, status: 'skipped', skip_reason: reason } : s);
    const nextStop = newStops.find((s: any) => s.sequence === currentStop.sequence + 1 && s.status === 'pending') || null;

    set({ routeStops: newStops, currentStop: nextStop, isArrived: false });
    approachedFor = null;

    await supabase.from('route_stops').update({ status: 'skipped', skip_reason: reason }).eq('id', currentStop.id).eq('company_id', cid);
  },

  reportIssue: async (issueType: string, description: string) => {
    const { currentStop, driver, gpsLocation, driverCompanyId } = get();
    const cid = driverCompanyId;
    if (!cid) return;

    const { error } = await supabase.from('environmental_issues').insert([{
      issue_type: issueType,
      severity: 'Medium',
      description: description || null,
      status: 'pending',
      building_id: currentStop?.building_id ?? null,
      reported_by: driver?.employee_id || driver?.id || 'driver',
      company_id: cid,
      latitude: gpsLocation?.latitude ?? null,
      longitude: gpsLocation?.longitude ?? null,
    }]);

    if (!error) {
      recordActivity({
        eventType: 'DRIVER_FEEDBACK_SUBMITTED',
        driverId: driver?.employee_id || driver?.id || 'unknown',
        companyId: cid,
        buildingId: currentStop?.building_id ?? null,
        latitude: gpsLocation?.latitude ?? null,
        longitude: gpsLocation?.longitude ?? null,
        metadata: { category: issueType },
      }).catch(() => {});
    }
  },

  toggleRoutePause: async (reason?: string) => {
    const { isRoutePaused, route, driverCompanyId, driver, gpsLocation } = get();
    const cid = driverCompanyId;
    const newPauseState = !isRoutePaused;

    set({ isRoutePaused: newPauseState });
    if (cid && driver) {
      recordActivity({
        eventType: newPauseState ? 'DRIVER_ROUTE_PAUSED' : 'DRIVER_ROUTE_RESUMED',
        driverId: driver.employee_id || driver.id,
        companyId: cid,
        routeId: route?.id ?? null,
        latitude: gpsLocation?.latitude ?? null,
        longitude: gpsLocation?.longitude ?? null,
        metadata: reason ? { reason } : {},
      }).catch(() => {});
    }

    if (route && cid) {
      try {
        await supabase.from('routes').update({ status: newPauseState ? 'paused' : 'active' }).eq('id', route.id).eq('company_id', cid);
      } catch (e) {
        console.error('Error updating route status:', e);
      }
    }
  },

  endShift: async () => {
    const { route, driverCompanyId, driver, gpsLocation } = get();
    const cid = driverCompanyId;
    if (!route || !cid) return;

    if (driver) {
      recordActivity({
        eventType: 'DRIVER_ROUTE_COMPLETED',
        driverId: driver.employee_id || driver.id,
        companyId: cid,
        routeId: route.id,
        latitude: gpsLocation?.latitude ?? null,
        longitude: gpsLocation?.longitude ?? null,
      }).catch(() => {});
    }
    deviationDetector.reset();

    try {
      await supabase.from('routes').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', route.id).eq('company_id', cid);
      await supabase.from('assignments').update({ status: 'completed' }).eq('route_id', route.id).eq('company_id', cid);
      await supabase.from('drivers').update({ status: 'available', current_assignment_id: null }).eq('id', Number(route.driver_id));
      await supabase.from('trucks').update({ status: 'available', current_driver: null }).eq('id', Number(route.truck_id));

      // Breadcrumb flush: final batch before stopping tracking
      await breadcrumbRecorder.flush();
      get().stopGpsTracking();

      set({
        route: null, routeStops: [], currentStop: null,
        isArrived: false, isRoutePaused: false, gpsLocation: null, gpsAccuracy: null,
      });
      approachedFor = null;
      routeStartRecorded = false;

      const uid = driver?.user_id;
      if (uid) {
        await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ driver: get().driver, driverCompanyId: cid, route: null, routeStops: [], currentStop: null }));
      }
    } catch (e) {
      console.error('Error ending shift:', e);
    }
  },
}));