import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { DriverRoute, RouteBuilding } from '../../app/hauler-dashboard/components/types';
import { calculateDistanceInMeters, calculateTotalDistanceKm } from '../../app/hauler-dashboard/utils/geo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface DriverSessionState {
  // Data
  driver: any;
  route: DriverRoute | null;
  routeStops: RouteBuilding[];
  currentStop: RouteBuilding | null;
  isArrived: boolean;
  gpsLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  progressStats: { distance: number; eta: number };

  // UI State
  searchQuery: string;
  searchResults: RouteBuilding[];
  isSearchFocused: boolean;
  showSkipModal: boolean;
  showReportModal: boolean;

  // ✅ NEW: Map Slice (State of Intent)
  cameraMode: 'following' | 'exploring' | 'navigating' | 'idle';
  highlightedNodeId: string | null;
  targetLocation: { lat: number; lng: number; zoom: number } | null;

  // Actions
  initializeSession: () => void;
  startGpsTracking: () => void;
  updateGps: (lat: number, lng: number) => void;
  completePickup: () => Promise<void>;
  skipStop: (reason: string) => Promise<void>;
  reportIssue: (issue: string) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchFocused: (focused: boolean) => void;
  selectSearchResult: (stop: RouteBuilding) => void;
  setShowSkipModal: (show: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  
  // ✅ NEW: Map Actions
  setCameraMode: (mode: 'following' | 'exploring' | 'navigating' | 'idle') => void;
  highlightNode: (id: string | null) => void;
  flyToLocation: (lat: number, lng: number, zoom: number) => void;
  centerOnDriver: () => void;
}

export const useDriverSession = create<DriverSessionState>((set, get) => ({
  // Initial State
  driver: null,
  route: null,
  routeStops: [],
  currentStop: null,
  isArrived: false,
  gpsLocation: null,
  isLoading: true,
  progressStats: { distance: 0, eta: 0 },
  searchQuery: '',
  searchResults: [],
  isSearchFocused: false,
  showSkipModal: false,
  showReportModal: false,
  
  // ✅ NEW: Map Initial State
  cameraMode: 'idle',
  highlightedNodeId: null,
  targetLocation: null,

  // Actions
  initializeSession: async () => {
    const storedDriver = localStorage.getItem('trakbin_driver');
    if (!storedDriver) { window.location.href = '/auth'; return; }
    const driver = JSON.parse(storedDriver);
    set({ driver });

    set({ isLoading: true });
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes').select('*').eq('driver_id', driver.employee_id || driver.id)
        .in('status', ['assigned', 'active']).order('created_at', { ascending: false }).limit(1).single();

      if (routeError || !routeData) { set({ route: null, routeStops: [], isLoading: false }); return; }
      set({ route: routeData });

      const { data: stopsData } = await supabase.from('route_stops').select('*').eq('route_id', routeData.id).order('sequence', { ascending: true });
      if (!stopsData) { set({ routeStops: [], isLoading: false }); return; }

      const buildingIds = stopsData.map((stop: any) => stop.building_id);
      const { data: buildingsData } = await supabase.from('Buildings').select('custom_id, address, latitude, longitude, payment_status, waste_type, estimated_waste, occupancy').in('custom_id', buildingIds);

      const mergedStops: RouteBuilding[] = stopsData.map((stop: any) => {
        const building = buildingsData?.find((b: any) => b.custom_id === stop.building_id);
        return { ...stop, status: stop.status as RouteBuilding['status'], address: building?.address, latitude: building?.latitude, longitude: building?.longitude, payment_status: building?.payment_status, waste_type: building?.waste_type, estimated_waste: building?.estimated_waste, occupancy: building?.occupancy };
      });

      set({ routeStops: mergedStops, currentStop: mergedStops.find((s: any) => s.status === 'pending') || null, isLoading: false });
    } catch (error) { console.error(error); set({ isLoading: false }); }
  },

  startGpsTracking: () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(
      (pos) => get().updateGps(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  },

  updateGps: (lat, lng) => {
    set({ gpsLocation: { lat, lng } });
    const { currentStop, isArrived } = get();
    if (currentStop && currentStop.latitude && currentStop.longitude) {
      const distance = calculateDistanceInMeters(lat, lng, currentStop.latitude, currentStop.longitude);
      if (distance <= 25 && !isArrived) set({ isArrived: true });
      else if (distance > 50 && isArrived) set({ isArrived: false });
    }
  },

  completePickup: async () => {
    const { currentStop, route, routeStops } = get();
    if (!currentStop || !route) return;

    const newStops = routeStops.map(s => s.id === currentStop.id ? { ...s, status: 'completed' as RouteBuilding['status'] } : s);
    const nextStop = newStops.find(s => s.sequence === currentStop.sequence + 1 && s.status === 'pending') || null;
    const newRoute = { ...route, completed_stops: route.completed_stops + 1 };

    set({ routeStops: newStops, currentStop: nextStop, route: newRoute, isArrived: false });

    await supabase.from('route_stops').update({ status: 'completed', completion_time: new Date().toISOString() }).eq('id', currentStop.id);
    await supabase.from('routes').update({ completed_stops: newRoute.completed_stops }).eq('id', route.id);
  },

  skipStop: async (reason: string) => {
    const { currentStop, routeStops } = get();
    if (!currentStop) return;

    const newStops = routeStops.map(s => s.id === currentStop.id ? { ...s, status: 'skipped' as RouteBuilding['status'], skip_reason: reason } : s);
    const nextStop = newStops.find(s => s.sequence === currentStop.sequence + 1 && s.status === 'pending') || null;

    set({ routeStops: newStops, currentStop: nextStop, isArrived: false, showSkipModal: false });
    await supabase.from('route_stops').update({ status: 'skipped', skip_reason: reason }).eq('id', currentStop.id);
  },

  reportIssue: (issue: string) => {
    console.log(`Reported: ${issue}`);
    set({ showReportModal: false });
    alert("Issue reported to dispatch!");
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (!query.trim()) { set({ searchResults: [] }); return; }
    const { routeStops } = get();
    const filtered = routeStops.filter(stop => stop.building_id.toLowerCase().includes(query.toLowerCase()) || (stop.address || '').toLowerCase().includes(query.toLowerCase()));
    set({ searchResults: filtered });
  },

  setIsSearchFocused: (focused) => set({ isSearchFocused: focused }),

  selectSearchResult: (stop) => {
    set({ searchQuery: stop.address || stop.building_id, isSearchFocused: false, currentStop: stop });
    // ✅ NEW: Tell the map to fly to this stop
    if (stop.latitude && stop.longitude) {
      set({ targetLocation: { lat: stop.latitude, lng: stop.longitude, zoom: 17 }, cameraMode: 'navigating' });
    }
  },

  setShowSkipModal: (show) => set({ showSkipModal: show }),
  setShowReportModal: (show) => set({ showReportModal: show }),

  // ✅ NEW: Map Actions
  setCameraMode: (mode) => set({ cameraMode: mode }),
  highlightNode: (id) => set({ highlightedNodeId: id }),
  flyToLocation: (lat, lng, zoom) => set({ targetLocation: { lat, lng, zoom }, cameraMode: 'navigating' }),
  centerOnDriver: () => set({ cameraMode: 'following' }),
}));