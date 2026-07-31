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

// The treasury slice — what the company has earned, net of platform fees,
// plus the per-settlement envelopes that produced it.
export interface EarningsState {
  available: number;
  lifetime: number;
  rateBps: number;
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

  // Earnings slice (the missing contract)
  earnings: EarningsState | null;
  settlements: any[];
  fetchEarnings: () => Promise<void>;
}

const resolveCompanyId = (tenantCompanyId: number | null): number | null => {
  if (tenantCompanyId) return tenantCompanyId;
  const stored = localStorage.getItem('trakbin_company');
  if (stored) {
    try { const p = JSON.parse(stored); return p.company_id ? Number(p.company_id) : null; }
    catch { return null; }
  }
  return null;
};

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
  earnings: null,
  settlements: [],

  loadTenantContext: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let userId = user?.id || null;
    let companyId: number | null = null;
    let role: UserRole = 'company';

    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', userId).single();
      companyId = profile?.company_id ?? null;
      role = (profile?.role as UserRole) || 'company';
    } else {
      const storedCompany = localStorage.getItem('trakbin_company');
      const storedDriver = localStorage.getItem('trakbin_driver');
      if (storedCompany) {
        try { const p = JSON.parse(storedCompany); userId = p.id; companyId = p.company_id; role = 'company'; }
        catch { localStorage.removeItem('trakbin_company'); }
      } else if (storedDriver) {
        try { const p = JSON.parse(storedDriver); userId = p.id; companyId = p.company_id; role = 'driver'; }
        catch { localStorage.removeItem('trakbin_driver'); }
      }
    }

    const numericCompanyId = companyId ? Number(companyId) : null;
    set({ tenant: { companyId: numericCompanyId, userId, role, loaded: true } });

    if (numericCompanyId) {
      await get().fetchFleet();
      await get().fetchServiceRequests();
      await get().fetchEarnings();
    }
  },

  fetchFleet: async () => {
    const cid = resolveCompanyId(get().tenant.companyId);
    if (!cid) return;
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select('*, drivers(name), trucks(truck_id)')
        .eq('company_id', cid)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      const trucks: Truck[] = (routes || []).map((r: any) => ({
        id: r.id,
        truck_id: r.trucks?.truck_id || 'Unknown',
        driver_name: r.drivers?.name || 'Unknown',
        status: r.status === 'paused' ? 'paused' : 'on_route',
        current_route_id: r.id,
        capacity_percent: 0,
        completed_stops: r.completed_stops || 0,
        total_stops: r.total_stops || 0,
        license_plate: '',
        truck_type: '',
      }));
      set({ trucks });
    } catch (e) { console.error('Error fetching fleet:', e); }
  },

  fetchServiceRequests: async () => {
    const cid = resolveCompanyId(get().tenant.companyId);
    if (!cid) return;
    const { data, error } = await supabase
      .from('service_requests')
      .select(`*, buildings:building_id (address, latitude, longitude, building_type)`)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });
    if (error) console.error('Error fetching requests:', error);
    else set({ serviceRequests: data || [] });
  },

  // Defensive: if the ledger columns aren't migrated yet, degrade to a zeroed
  // treasury rather than throwing — the page then renders its honest empty state.
  fetchEarnings: async () => {
    const cid = resolveCompanyId(get().tenant.companyId);
    if (!cid) return;
    try {
      const [{ data: hauler }, { data: settings }, { data: txs }] = await Promise.all([
        supabase.from('haulers').select('available_balance, lifetime_earnings, commission_bps').eq('id', cid).maybeSingle(),
        supabase.from('platform_settings').select('commission_bps').maybeSingle(),
        supabase.from('ledger_transactions').select('*').eq('company_id', cid).eq('type', 'settlement').order('created_at', { ascending: false }).limit(40),
      ]);
      set({
        earnings: {
          available: hauler?.available_balance ?? 0,
          lifetime: hauler?.lifetime_earnings ?? 0,
          rateBps: hauler?.commission_bps ?? settings?.commission_bps ?? 1000,
        },
        settlements: txs || [],
      });
    } catch (e) {
      console.warn('fetchEarnings degraded (ledger columns missing?):', e);
      set({ earnings: { available: 0, lifetime: 0, rateBps: 1000 }, settlements: [] });
    }
  },

  activateService: async (requestId, zoneId, scheduleData) => {
    const cid = resolveCompanyId(get().tenant.companyId);
    if (!cid) return;
    try {
      const { data: request } = await supabase.from('service_requests').select('building_id').eq('id', requestId).single();
      if (!request) throw new Error('Request not found');
      const now = new Date().toISOString();

      await supabase.from('service_requests').update({ status: 'activated', company_id: cid, activated_at: now }).eq('id', requestId);
      await supabase.from('service_assignments').insert([{
        building_id: request.building_id, company_id: cid, zone_id: zoneId,
        schedule_template: scheduleData.frequency, pickup_days: scheduleData.days,
        time_window: scheduleData.timeWindow, service_status: 'active', activated_at: now,
      }]);
      await supabase.from('collection_schedules').insert([{
        company_id: cid, building_id: request.building_id,
        frequency: scheduleData.frequency, pickup_day: scheduleData.days.join(', '),
        time_window: scheduleData.timeWindow, is_active: true,
      }]);
      await supabase.from('Buildings').update({ company_id: cid, status: 'active' }).eq('custom_id', request.building_id);

      const { data: hauler } = await supabase.from('haulers').select('contact_number').eq('id', cid).maybeSingle();
      await supabase.from('company_profiles').upsert(
        { id: cid, contact_numbers: hauler?.contact_number ? [{ type: 'call', label: 'Main Line', value: hauler.contact_number }] : [] },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      await supabase.from('environmental_issue_history').insert([{
        issue_id: null, action: 'SERVICE_ACTIVATED', performed_by: `company_${cid}`,
        metadata: { request_id: requestId, building_id: request.building_id },
      }]);

      get().addDispatchEvent({ type: 'service_activated', truck_id: 'N/A', driver_name: 'System', building_id: request.building_id, message: `Service activated for building ${request.building_id}` });
      await get().fetchServiceRequests();
      get().setIsDrawerOpen(false);
      get().addNotification('Service activated successfully!', 'success');
    } catch (e) {
      console.error('Activation failed:', e);
      get().addNotification('Failed to activate service.', 'error');
    }
  },

  updateTruckStatus: (truckId, status) => set((s) => ({ trucks: s.trucks.map((t) => (t.id === truckId ? { ...t, status } : t)) })),
  addDispatchEvent: (event) => {
    const e: DispatchEvent = { ...event, id: `event-${Date.now()}`, timestamp: new Date().toISOString() };
    set((s) => ({ dispatchTimeline: [e, ...s.dispatchTimeline].slice(0, 100) }));
  },
  addNotification: (message, type) => {
    const n = { id: `notif-${Date.now()}`, message, timestamp: new Date().toISOString(), type };
    set((s) => ({ activeNotifications: [n, ...s.activeNotifications].slice(0, 10) }));
    setTimeout(() => get().clearNotification(n.id), 5000);
  },
  clearNotification: (id) => set((s) => ({ activeNotifications: s.activeNotifications.filter((n) => n.id !== id) })),
  setSelectedTruck: (truck) => set({ selectedTruck: truck }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  subscribeToRealtime: () => {
    const cid = resolveCompanyId(get().tenant.companyId);
    if (!cid) return () => {};
    const routeSub = supabase
      .channel('routes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes', filter: `company_id=eq.${cid}` }, (p) => {
        const n = p.new as any;
        get().updateTruckStatus(n.route_id, n.status === 'paused' ? 'paused' : n.status === 'completed' ? 'completed' : 'on_route');
      })
      .subscribe();
    // A caretaker settlement lands => the treasury repaints live.
    const ledgerSub = supabase
      .channel(`company-ledger-${cid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ledger_transactions', filter: `company_id=eq.${cid}` }, () => { get().fetchEarnings(); })
      .subscribe();
    return () => { supabase.removeChannel(routeSub); supabase.removeChannel(ledgerSub); };
  },
  unsubscribeFromRealtime: () => { supabase.removeAllChannels(); },
}));