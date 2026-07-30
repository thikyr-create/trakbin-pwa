import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
  
  // NEW: Service Request State
  serviceRequests: any[];
  selectedRequest: any | null;
  isDrawerOpen: boolean;
  fetchServiceRequests: () => Promise<void>;
  setSelectedRequest: (request: any | null) => void;
  setIsDrawerOpen: (isOpen: boolean) => void;
}

export const useCompanySession = create<CompanySessionState>((set, get) => ({
  tenant: { companyId: null, userId: null, role: null, loaded: false },
  trucks: [],
  dispatchTimeline: [],
  activeNotifications: [],
  selectedTruck: null,
  cameraMode: 'overview',
  
  // NEW: Initial Service Request State
  serviceRequests: [],
  selectedRequest: null,
  isDrawerOpen: false,

  loadTenantContext: async () => {
    console.log(' Loading tenant context...');
    const { data: { user } } = await supabase.auth.getUser();
    
    let userId = user?.id || null;
    let companyId = null;
    let role: UserRole = 'company';

    if (userId) {
      console.log('✅ Found Supabase Auth user:', userId);
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', userId)
        .single();
      companyId = profile?.company_id;
      role = profile?.role as UserRole;
    } else {
      console.log('❌ No Supabase Auth user, checking localStorage...');
      const storedCompany = localStorage.getItem('trakbin_company');
      const storedDriver = localStorage.getItem('trakbin_driver');

      if (storedCompany) {
        try {
          const parsed = JSON.parse(storedCompany);
          console.log('✅ Found stored company:', parsed);
          userId = parsed.id;
          companyId = parsed.company_id;
          role = 'company'; 
        } catch (e) {
          console.error('❌ Failed to parse stored company data:', e);
          localStorage.removeItem('trakbin_company');
        }
      } else if (storedDriver) {
        try {
          const parsed = JSON.parse(storedDriver);
          console.log('✅ Found stored driver:', parsed);
          userId = parsed.id;
          companyId = parsed.company_id;
          role = 'driver';
        } catch (e) {
          console.error('❌ Failed to parse stored driver data:', e);
          localStorage.removeItem('trakbin_driver');
        }
      } else {
        console.log('❌ No stored session found');
      }
    }

    const numericCompanyId = companyId ? Number(companyId) : null;
    console.log(' Final Tenant Context:', { userId, companyId: numericCompanyId, role });

    set({
      tenant: {
        companyId: numericCompanyId,
        userId: userId,
        role: role,
        loaded: true,
      }
    });
    
    if (numericCompanyId) {
      console.log(' Fetching fleet for company:', numericCompanyId);
      await get().fetchFleet();
      await get().fetchServiceRequests(); // Fetch requests on load
    } else {
      console.warn('️ No company_id found, skipping fleet fetch');
    }
  },

  fetchFleet: async () => {
    const { tenant } = get();
    let currentCompanyId = tenant.companyId;
    
    if (!currentCompanyId) {
      const stored = localStorage.getItem('trakbin_company');
      if (stored) {
        const parsed = JSON.parse(stored);
        currentCompanyId = parsed.company_id ? Number(parsed.company_id) : null;
      }
    }
    if (!currentCompanyId) return;

    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select('*, drivers(name), trucks(truck_id)')
        .eq('company_id', currentCompanyId) 
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

  // NEW: Fetch Service Requests
  fetchServiceRequests: async () => {
    const { tenant } = get();
    let currentCompanyId = tenant.companyId;
    
    if (!currentCompanyId) {
      const stored = localStorage.getItem('trakbin_company');
      if (stored) {
        const parsed = JSON.parse(stored);
        currentCompanyId = parsed.company_id ? Number(parsed.company_id) : null;
      }
    }
    if (!currentCompanyId) return;

    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        buildings:building_id (address, latitude, longitude, building_type)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) console.error('Error fetching requests:', error);
    else set({ serviceRequests: data || [] });
  },

  updateTruckStatus: (truckId, status) => {
    set((state) => ({ trucks: state.trucks.map((t) => (t.id === truckId ? { ...t, status } : t)) }));
  },

  addDispatchEvent: (event) => {
    const newEvent: DispatchEvent = {
      ...event,
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ dispatchTimeline: [newEvent, ...state.dispatchTimeline].slice(0, 100) }));
  },

  addNotification: (message, type) => {
    const notification = {
      id: `notif-${Date.now()}`,
      message,
      timestamp: new Date().toISOString(),
      type,
    };
    set((state) => ({ activeNotifications: [notification, ...state.activeNotifications].slice(0, 10) }));
    setTimeout(() => get().clearNotification(notification.id), 5000);
  },

  clearNotification: (id) => {
    set((state) => ({ activeNotifications: state.activeNotifications.filter((n) => n.id !== id) }));
  },

  setSelectedTruck: (truck) => set({ selectedTruck: truck }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  
  // NEW: Service Request Actions
  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  subscribeToRealtime: () => {
    const { tenant } = get();
    if (!tenant.companyId) return () => {};

    const routeSubscription = supabase
      .channel('routes-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'routes',
        filter: `company_id=eq.${tenant.companyId}` 
      }, (payload) => {
        const newPayload = payload.new as any;
        const { route_id, status } = newPayload;
        get().updateTruckStatus(route_id, status === 'paused' ? 'paused' : status === 'completed' ? 'completed' : 'on_route');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(routeSubscription);
    };
  },

  unsubscribeFromRealtime: () => {
    supabase.removeAllChannels();
  },
}));