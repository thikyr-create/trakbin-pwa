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
  | 'disposal' | 'reassignment' | 'driver_added' | 'truck_added' | 'service_activated';

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

  serviceRequests: any[];
  selectedRequest: any | null;
  isDrawerOpen: boolean;
  fetchServiceRequests: () => Promise<void>;
  setSelectedRequest: (request: any | null) => void;
  setIsDrawerOpen: (isOpen: boolean) => void;

  activateService: (requestId: string, zoneId: string, scheduleData: any) => Promise<void>;
}

export const useCompanySession = create<CompanySessionState>((set, get) => ({
  tenant: { companyId: null, userId: null, role: null, loaded: false },
  trucks: [],
  dispatchTimeline: [],
  activeNotifications: [],
  selectedTruck: null,
  cameraMode: 'overview',
  serviceRequests: [],
  selectedRequest: null,
  isDrawerOpen: false,

  loadTenantContext: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let userId = user?.id || null;
    let companyId = null;
    let role: UserRole = 'company';

    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', userId).single();
      companyId = profile?.company_id;
      role = profile?.role as UserRole;
    } else {
      const storedCompany = localStorage.getItem('trakbin_company');
      const storedDriver = localStorage.getItem('trakbin_driver');

      if (storedCompany) {
        const parsed = JSON.parse(storedCompany);
        userId = parsed.id;
        companyId = parsed.company_id;
        role = 'company';
      } else if (storedDriver) {
        const parsed = JSON.parse(storedDriver);
        userId = parsed.id;
        companyId = parsed.company_id;
        role = 'driver';
      }
    }

    const numericCompanyId = companyId ? Number(companyId) : null;
    set({ tenant: { companyId: numericCompanyId, userId: userId, role: role, loaded: true } });

    if (numericCompanyId) {
      await get().fetchFleet();
      await get().fetchServiceRequests();
    }
  },

  fetchFleet: async () => {
    const { tenant } = get();
    let currentCompanyId = tenant.companyId;
    if (!currentCompanyId) {
      const stored = localStorage.getItem('trakbin_company');
      if (stored) currentCompanyId = JSON.parse(stored).company_id ? Number(JSON.parse(stored).company_id) : null;
    }
    if (!currentCompanyId) return;

    try {
      const { data: routes, error } = await supabase.from('routes').select('*, drivers(name), trucks(truck_id)').eq('company_id', currentCompanyId).in('status', ['active', 'paused']).order('created_at', { ascending: false });
      if (error) throw error;
      const trucks: Truck[] = (routes || []).map((route: any) => ({
        id: route.id, truck_id: route.trucks?.truck_id || 'Unknown', driver_name: route.drivers?.name || 'Unknown',
        status: route.status === 'paused' ? 'paused' : 'on_route', current_route_id: route.id, capacity_percent: 0,
        completed_stops: route.completed_stops || 0, total_stops: route.total_stops || 0, license_plate: '', truck_type: '',
      }));
      set({ trucks });
    } catch (error) { console.error('Error fetching fleet:', error); }
  },

  fetchServiceRequests: async () => {
    const { tenant } = get();
    let currentCompanyId = tenant.companyId;
    if (!currentCompanyId) {
      const stored = localStorage.getItem('trakbin_company');
      if (stored) currentCompanyId = JSON.parse(stored).company_id ? Number(JSON.parse(stored).company_id) : null;
    }
    if (!currentCompanyId) return;

    const { data, error } = await supabase.from('service_requests').select(`*, buildings:building_id (address, latitude, longitude, building_type)`).eq('status', 'pending').order('submitted_at', { ascending: false });
    if (error) console.error('Error fetching requests:', error);
    else set({ serviceRequests: data || [] });
  },

  // Domain event: a single activation provisions the whole relationship.
  activateService: async (requestId, zoneId, scheduleData) => {
    const { tenant } = get();
    if (!tenant.companyId) return;

    try {
      const { data: request } = await supabase.from('service_requests').select('building_id').eq('id', requestId).single();
      if (!request) throw new Error('Request not found');

      const now = new Date().toISOString();

      // A. Flip the request to activated
      await supabase.from('service_requests').update({ status: 'activated', company_id: tenant.companyId, activated_at: now }).eq('id', requestId);

      // B. The active contract
      await supabase.from('service_assignments').insert([{
        building_id: request.building_id, company_id: tenant.companyId, zone_id: zoneId,
        schedule_template: scheduleData.frequency, pickup_days: scheduleData.days,
        time_window: scheduleData.timeWindow, service_status: 'active', activated_at: now
      }]);

      // C. Operational schedule for the routing engine
      await supabase.from('collection_schedules').insert([{
        company_id: tenant.companyId, building_id: request.building_id,
        frequency: scheduleData.frequency, pickup_day: scheduleData.days.join(', '),
        time_window: scheduleData.timeWindow, is_active: true
      }]);

      // D. Link the building
      await supabase.from('Buildings').update({ company_id: tenant.companyId, status: 'active' }).eq('custom_id', request.building_id);

      // D+. Materialize the rich profile row ONCE, seeded with the signup number.
      //     ignoreDuplicates = seed-once semantics: never clobber later edits.
      const { data: hauler } = await supabase.from('haulers').select('contact_number').eq('id', tenant.companyId).maybeSingle();
      await supabase.from('company_profiles').upsert(
        {
          id: tenant.companyId,
          contact_numbers: hauler?.contact_number
            ? [{ type: 'call', label: 'Main Line', value: hauler.contact_number }]
            : [],
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      // E. Audit trail
      await supabase.from('environmental_issue_history').insert([{
        issue_id: null, action: 'SERVICE_ACTIVATED', performed_by: `company_${tenant.companyId}`,
        metadata: { request_id: requestId, building_id: request.building_id }
      }]);

      // F. Broadcast + refresh UI
      get().addDispatchEvent({ type: 'service_activated', truck_id: 'N/A', driver_name: 'System', building_id: request.building_id, message: `Service activated for building ${request.building_id}` });
      await get().fetchServiceRequests();
      get().setIsDrawerOpen(false);
      get().addNotification('Service activated successfully!', 'success');

    } catch (error) {
      console.error('Activation failed:', error);
      get().addNotification('Failed to activate service.', 'error');
    }
  },

  updateTruckStatus: (truckId, status) => set((state) => ({ trucks: state.trucks.map((t) => (t.id === truckId ? { ...t, status } : t)) })),
  addDispatchEvent: (event) => {
    const newEvent: DispatchEvent = { ...event, id: `event-${Date.now()}`, timestamp: new Date().toISOString() };
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
  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  subscribeToRealtime: () => {
    const { tenant } = get();
    if (!tenant.companyId) return () => {};
    const routeSubscription = supabase.channel('routes-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'routes', filter: `company_id=eq.${tenant.companyId}` }, (payload) => {
      const newPayload = payload.new as any;
      get().updateTruckStatus(newPayload.route_id, newPayload.status === 'paused' ? 'paused' : newPayload.status === 'completed' ? 'completed' : 'on_route');
    }).subscribe();
    return () => { supabase.removeChannel(routeSubscription); };
  },
  unsubscribeFromRealtime: () => { supabase.removeAllChannels(); },
}));