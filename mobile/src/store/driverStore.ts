// src/store/driverStore.ts
import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface RouteStop {
  id: number | string;
  building_id: string;
  status: string;
  sequence: number;
  arrival_time?: string;
  completion_time?: string;
  skip_reason?: string;
}

interface Route {
  id: number | string;
  driver_id: string;
  company_id: number;
  status: string;
  completed_stops: number;
  total_stops: number;
}

interface GpsLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

interface DriverState {
  driver: any | null;
  route: Route | null;
  stops: RouteStop[];
  currentStop: RouteStop | null;
  gps: GpsLocation | null;
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  updateGps: (lat: number, lng: number, accuracy?: number) => void;
  completePickup: () => Promise<void>;
  skipStop: (reason: string) => Promise<void>;
  pauseRoute: () => Promise<void>;
  resumeRoute: () => Promise<void>;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  driver: null,
  route: null,
  stops: [],
  currentStop: null,
  gps: null,
  loading: false,
  loaded: false,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, loaded: true });
        return;
      }

      // Fetch driver by user_id
      const { data: driver } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!driver) {
        set({ loading: false, loaded: true });
        return;
      }

      // Fetch active route for this driver
      const { data: route } = await supabase
        .from('routes')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('company_id', driver.company_id)
        .in('status', ['in_progress', 'paused'])
        .maybeSingle();

      if (!route) {
        set({ driver, route: null, stops: [], currentStop: null, loading: false, loaded: true });
        return;
      }

      // Fetch route stops
      const { data: stopsData } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', route.id)
        .eq('company_id', driver.company_id)
        .order('sequence', { ascending: true });

      const stops: RouteStop[] = (stopsData as RouteStop[]) || [];
      const currentStop = stops.find((s: RouteStop) => s.status === 'pending') || null;

      set({
        driver,
        route,
        stops,
        currentStop,
        loading: false,
        loaded: true,
      });
    } catch {
      set({ loading: false, loaded: true });
    }
  },

  updateGps: (lat, lng, accuracy) => {
    set({ gps: { lat, lng, accuracy, timestamp: new Date().toISOString() } });
  },

  completePickup: async () => {
    const { currentStop, route, stops } = get();
    if (!currentStop || !route) return;

    const driver = get().driver;
    if (!driver) return;
    const cid = driver.company_id;

    console.log('[driver] completePickup, company=', cid, 'stop=', currentStop.building_id);

    // CRITICAL: Write completion_time so caretaker notification read-model picks it up
    await supabase
      .from('route_stops')
      .update({ status: 'completed', completion_time: new Date().toISOString() })
      .eq('id', currentStop.id)
      .eq('company_id', cid);

    // Update route progress
    const completed_stops = route.completed_stops + 1;
    await supabase
      .from('routes')
      .update({ completed_stops })
      .eq('id', route.id)
      .eq('company_id', cid);

    // Update local state
    const updatedStops = stops.map((s: RouteStop) =>
      s.id === currentStop.id
        ? { ...s, status: 'completed', completion_time: new Date().toISOString() }
        : s
    );
    const nextStop = updatedStops.find((s: RouteStop) => s.status === 'pending') || null;

    set({
      route: { ...route, completed_stops },
      stops: updatedStops,
      currentStop: nextStop,
    });
  },

  skipStop: async (reason) => {
    const { currentStop, stops } = get();
    if (!currentStop) return;

    const driver = get().driver;
    if (!driver) return;
    const cid = driver.company_id;

    await supabase
      .from('route_stops')
      .update({ status: 'skipped', skip_reason: reason })
      .eq('id', currentStop.id)
      .eq('company_id', cid);

    const updatedStops = stops.map((s: RouteStop) =>
      s.id === currentStop.id ? { ...s, status: 'skipped', skip_reason: reason } : s
    );
    const nextStop = updatedStops.find((s: RouteStop) => s.status === 'pending') || null;

    set({ stops: updatedStops, currentStop: nextStop });
  },

  pauseRoute: async () => {
    const { route } = get();
    if (!route) return;
    const driver = get().driver;
    if (!driver) return;

    await supabase
      .from('routes')
      .update({ status: 'paused' })
      .eq('id', route.id)
      .eq('company_id', driver.company_id);

    set({ route: { ...route, status: 'paused' } });
  },

  resumeRoute: async () => {
    const { route } = get();
    if (!route) return;
    const driver = get().driver;
    if (!driver) return;

    await supabase
      .from('routes')
      .update({ status: 'in_progress' })
      .eq('id', route.id)
      .eq('company_id', driver.company_id);

    set({ route: { ...route, status: 'in_progress' } });
  },
}));