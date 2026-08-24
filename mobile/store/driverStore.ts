// mobile/store/driverStore.ts
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { fetchActiveRoute, fetchStops, type Stop } from '../services/routes';
import { useAuthStore } from './authStore';

interface DriverState {
  route: any | null;
  stops: Stop[];
  loading: boolean;
  load: () => Promise<void>;
  startRoute: () => Promise<void>;
   completeStop: (stopId: string, extra?: { proof_url?: string | null; note?: string | null }) => Promise<void>;
  skipStop: (stopId: string, reason: string) => Promise<void>;
}

const cid = () => Number(useAuthStore.getState().driver?.company_id) || null;

export const useDriverStore = create<DriverState>((set, get) => ({
  route: null, stops: [], loading: false,

  load: async () => {
    const driver = useAuthStore.getState().driver;
    const c = cid(); if (!driver || !c) return;
    set({ loading: true });
    const route = await fetchActiveRoute(c, Number(driver.id));
    const stops = route ? await fetchStops(c, route.id) : [];
    set({ route, stops, loading: false });
  },

  startRoute: async () => {
    const { route } = get(); const c = cid(); if (!route || !c) return;
    await supabase.from('routes').update({ status: 'active' }).eq('id', route.id).eq('company_id', c);
    set({ route: { ...route, status: 'active' } });
  },

    completeStop: async (stopId, extra) => {
    const { route, stops } = get(); const c = cid(); if (!route || !c) return;
    const done = (route.completed_stops ?? 0) + 1;
    await supabase.from('route_stops').update({
      status: 'completed',
      completion_time: new Date().toISOString(),
      proof_url: extra?.proof_url ?? null,
      note: extra?.note ?? null,
    }).eq('id', stopId).eq('company_id', c);
    await supabase.from('routes').update({ completed_stops: done }).eq('id', route.id).eq('company_id', c);
    set({
      stops: stops.map((s) => (s.id === stopId ? { ...s, status: 'completed' } : s)),
      route: { ...route, completed_stops: done },
    });
  },

  skipStop: async (stopId, reason) => {
    const { route, stops } = get(); const c = cid(); if (!route || !c) return;
    await supabase.from('route_stops').update({ status: 'skipped', skip_reason: reason }).eq('id', stopId).eq('company_id', c);
    set({ stops: stops.map((s) => (s.id === stopId ? { ...s, status: 'skipped', skip_reason: reason } : s)) });
  },
}));