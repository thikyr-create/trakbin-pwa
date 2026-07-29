import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TENANT CONTEXT ---
export type UserRole = 'company' | 'driver' | 'caretaker' | 'admin' | 'government' | null;

export interface TenantContext {
  companyId: number | null; 
  userId: string | null;
  role: UserRole;
  loaded: boolean;
}

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
  tenant: TenantContext;
  loadTenantContext: () => Promise<void>;
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
  subscribeToRealtime: () => () => void;
  unsubscribeFromRealtime: () => void;
}

export const useCompanySession = create<CompanySessionState>((set, get) => ({
  tenant: { companyId: null, userId: null, role: null, loaded: false },
  trucks: [],
  dispatchTimeline: [],
  activeNotifications: [],
  selectedTruck: null,
  cameraMode: 'overview',

  loadTenantContext: async () => {
    // 1. Try Official Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    let userId = user?.id || null;
    let companyId = null;
    let role: UserRole = 'company';

    if (userId) {
      // If official auth user exists, query profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', userId)
        .single();
      companyId = profile?.company_id;
      role = profile?.role as UserRole;
    } else {
      // 2. FALLBACK: Custom Auth (Check LocalStorage)
      // This is what your Waste Company and Driver logins use!
      const storedCompany = localStorage.getItem('trakbin_company');
      const storedDriver = localStorage.getItem('trakbin_driver');

      if (storedCompany) {
        const parsed = JSON.parse(storedCompany);
        userId = parsed.id; // The ID from your custom users table
        companyId = parsed.company_id;
        role = 'company'; 
      } else if (storedDriver) {
        const parsed = JSON.parse(storedDriver);
        userId = parsed.id;
        companyId = parsed.company_id;
        role = 'driver';
      }
    }

    // CRITICAL: Ensure companyId is a Number (your users table has it as text, but DB needs number)
    const numericCompanyId = companyId ? Number(companyId) : null;

    set({
      tenant: {
        companyId: numericCompanyId,
        userId: userId,
        role: role,
        loaded: true,
      }
    });
  },

  fetchFleet: async () => {
    const { tenant } = get();
    if (!tenant.companyId) return;
    // ... (rest of your existing fleet logic)
  },

  // ... (keep all your other existing functions: updateTruckStatus, addDispatchEvent, etc.)
  updateTruckStatus: (truckId, status) => {
    set((state) => ({ trucks: state.trucks.map((t) => (t.id === truckId ? { ...t, status } : t)) }));
  },
  addDispatchEvent: (event) => {
    const newEvent = { ...event, id: `event-${Date.now()}`, timestamp: new Date().toISOString() };
    set((state) => ({ dispatchTimeline: [newEvent, ...state.dispatchTimeline].slice(0, 100) }));
  },
  addNotification: (message, type) => {
    const notification = { id: `notif-${Date.now()}`, message, timestamp: new Date().toISOString(), type };
    set((state) => ({ activeNotifications: [notification, ...state.activeNotifications].slice(0, 10) }));
    setTimeout(() => get().clearNotification(notification.id), 5000);
  },
  clearNotification: (id) => set((state) => ({ activeNotifications: state.activeNotifications.filter((n) => n.id !== id) })),
  setSelectedTruck: (truck) => set({ selectedTruck: truck }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  subscribeToRealtime: () => { return () => {}; }, // Placeholder
  unsubscribeFromRealtime: () => {}, // Placeholder
}));