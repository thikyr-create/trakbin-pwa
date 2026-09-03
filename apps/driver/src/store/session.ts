import { create } from 'zustand';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SNAPSHOT_KEY = 'trakbin_snapshot_driver';

export interface SessionState {
  driver: any;
  driverCompanyId: number | null;
  route: any;
  routeStops: any[];
  currentStop: any;
  isLoading: boolean;
  initializeSession: () => Promise<void>;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  driver: null,
  driverCompanyId: null,
  route: null,
  routeStops: [],
  currentStop: null,
  isLoading: true,

  initializeSession: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    // SWR: paint last-known session instantly
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

      const { data: stopsData } = await supabase
        .from('route_stops')
        .select('*')
        .eq('company_id', cid)
        .eq('route_id', route.id)
        .order('sequence', { ascending: true });

      if (!stopsData || stopsData.length === 0) {
        set({ route, routeStops: [], currentStop: null, isLoading: false });
        return;
      }

      const buildingIds = stopsData.map((s: any) => s.building_id);
      const { data: buildings } = await supabase
        .from('Buildings')
        .select('custom_id, address, estate, latitude, longitude')
        .eq('company_id', cid)
        .in('custom_id', buildingIds);

      const mergedStops = stopsData.map((stop: any) => {
        const b = buildings?.find((x: any) => x.custom_id === stop.building_id);
        return {
          ...stop,
          address: b?.address,
          estate: b?.estate,
          latitude: b?.latitude != null ? Number(b.latitude) : null,
          longitude: b?.longitude != null ? Number(b.longitude) : null,
        };
      });

      const currentStop = mergedStops.find((s: any) => s.status === 'pending') || null;
      set({ route, routeStops: mergedStops, currentStop, isLoading: false });
      await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ driver, driverCompanyId: cid, route, routeStops: mergedStops, currentStop }));
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  resetSession: () => {
    set({ driver: null, driverCompanyId: null, route: null, routeStops: [], currentStop: null, isLoading: false });
  },
}));