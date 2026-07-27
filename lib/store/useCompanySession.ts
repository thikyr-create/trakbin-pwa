import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type DispatchEventType = 
  | 'route_started' | 'pickup_completed' | 'pickup_skipped' | 'issue_reported' 
  | 'route_paused' | 'route_resumed' | 'route_completed' | 'truck_full' 
  | 'disposal' | 'reassignment' | 'driver_added' | 'truck_added';

export interface DispatchEvent {
  id: string;
  timestamp: string;
  type: DispatchEventType;
  truck_id: string;
  driver_name: string;
  building_id?: string;
  message: string;
  metadata?: any;
}

export interface Truck {
  id: string;
  truck_id: string;
  driver_name: string;
  status: 'available' | 'on_route' | 'paused' | 'completed' | 'offline' | 'active' | 'idle' | 'maintenance';
  current_route_id?: string;
  capacity_percent: number;
  last_location?: { lat: number; lng: number };
  completed_stops: number;
  total_stops: number;
  license_plate: string;
  truck_type: string;
}

export interface CompanySessionState {
  trucks: Truck[];
  dispatchTimeline: DispatchEvent[];
  activeNotifications: Array<{ id: string; message: string; timestamp: string; type: 'success' | 'warning' | 'error' | 'info' }>;
  selectedTruck: Truck | null;
  cameraMode: 'overview' | 'following' | 'navigating';
  
  fetchFleet: () => Promise<void>;
  updateTruckStatus: (truckId: string, status: Truck['status']) => void;
  addDispatchEvent: (event: Omit<DispatchEvent, 'id' | 'timestamp'>) => void;
  addNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  clearNotification: (id: string) => void;
  setSelectedTruck: (truck: Truck | null) => void;
  setCameraMode: (mode: 'overview' | 'following' | 'navigating') => void;
  
  // FIX: Always returns a cleanup function (never void)
  subscribeToRealtime: () => () => void;
  unsubscribeFromRealtime: () => void;
}

export const useCompanySession = create<CompanySessionState>((set, get) => ({
  trucks: [],
  dispatchTimeline: [],
  activeNotifications: [],
  selectedTruck: null,
  cameraMode: 'overview',

  fetchFleet: async () => {
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select('*, drivers(name), trucks(truck_id)')
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const trucks: Truck[] = (routes || []).map((route: any) => ({
        id: route.id,
        truck_id: route.trucks?.truck_id || 'Unknown',
        driver_name: route.drivers?.name || 'Unknown',
        status: route.status === 'paused' ? 'paused' : 'on_route',
        current_route_id: route.id,
        capacity_percent: 0,
        completed_stops: route.completed_stops || 0,
        total_stops: route.total_stops || 0,
        license_plate: '',
        truck_type: '',
      }));

      set({ trucks });
    } catch (error) {
      console.error('Error fetching fleet:', error);
    }
  },

  updateTruckStatus: (truckId, status) => {
    set((state) => ({
      trucks: state.trucks.map((t) => (t.id === truckId ? { ...t, status } : t)),
    }));
  },

  addDispatchEvent: (event) => {
    const newEvent: DispatchEvent = {
      ...event,
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      dispatchTimeline: [newEvent, ...state.dispatchTimeline].slice(0, 100),
    }));
  },

  addNotification: (message, type) => {
    const notification = {
      id: `notif-${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      type,
    };

    set((state) => ({
      activeNotifications: [notification, ...state.activeNotifications].slice(0, 10),
    }));

    setTimeout(() => {
      get().clearNotification(notification.id);
    }, 5000);
  },

  clearNotification: (id) => {
    set((state) => ({
      activeNotifications: state.activeNotifications.filter((n) => n.id !== id),
    }));
  },

  setSelectedTruck: (truck) => set({ selectedTruck: truck }),
  setCameraMode: (mode) => set({ cameraMode: mode }),

  subscribeToRealtime: () => {
    const routeSubscription = supabase
      .channel('routes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, (payload) => {
        const newPayload = payload.new as any;
        const { route_id, status, completed_stops, total_stops } = newPayload;
        
        get().updateTruckStatus(route_id, status === 'paused' ? 'paused' : status === 'completed' ? 'completed' : 'on_route');

        if (status === 'completed') {
          get().addDispatchEvent({
            type: 'route_completed',
            truck_id: newPayload.truck_id || 'Unknown',
            driver_name: newPayload.driver_name || 'Unknown',
            message: `Route completed: ${completed_stops}/${total_stops} stops`,
          });

          get().addNotification(
            `${newPayload.truck_id || 'Unknown'} completed route with ${completed_stops}/${total_stops} stops`,
            'success'
          );
        } else if (status === 'paused') {
          get().addDispatchEvent({
            type: 'route_paused',
            truck_id: newPayload.truck_id || 'Unknown',
            driver_name: newPayload.driver_name || 'Unknown',
            message: 'Route paused - truck likely at disposal facility',
          });
        }
      })
      .subscribe();

    const stopsSubscription = supabase
      .channel('route-stops-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'route_stops' }, (payload) => {
        const newPayload = payload.new as any;
        const { status, building_id, skip_reason } = newPayload;
        
        if (status === 'completed') {
          get().addDispatchEvent({
            type: 'pickup_completed',
            truck_id: 'Unknown',
            driver_name: 'Unknown',
            building_id,
            message: `Pickup completed at ${building_id}`,
          });
        } else if (status === 'skipped') {
          get().addDispatchEvent({
            type: 'pickup_skipped',
            truck_id: 'Unknown',
            driver_name: 'Unknown',
            building_id,
            message: `Pickup skipped at ${building_id}: ${skip_reason}`,
          });

          get().addNotification(`Pickup skipped at ${building_id}: ${skip_reason}`, 'warning');
        }
      })
      .subscribe();

    // FIX: Always return a cleanup function
    return () => {
      supabase.removeChannel(routeSubscription);
      supabase.removeChannel(stopsSubscription);
    };
  },

  unsubscribeFromRealtime: () => {
    supabase.removeAllChannels();
  },
}));