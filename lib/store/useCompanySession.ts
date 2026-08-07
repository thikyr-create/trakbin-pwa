"use client";

import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { type FeeRule } from '@/lib/utils/money';
import { canOperate } from '@/lib/auth/companyVerification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'company' | 'driver' | 'caretaker' | 'admin' | 'government' | null;
export interface TenantContext { companyId: number | null; userId: string | null; role: UserRole; loaded: boolean; }
export type DispatchEventType = 'route_started' | 'pickup_completed' | 'pickup_skipped' | 'issue_reported' | 'route_paused' | 'route_resumed' | 'route_completed'| 'truck_full' | 'disposal' | 'reassignment' | 'driver_added' | 'truck_added' | 'service_activated';
export interface DispatchEvent { id: string; timestamp: string; type: DispatchEventType; truck_id: string; driver_name: string; building_id?: string; message: string; metadata?: any; }
export interface Truck { id: string; truck_id: string; driver_name: string; status: any; current_route_id?: string; capacity_percent: number; last_location?: { lat: number; lng: number }; completed_stops: number; total_stops: number; license_plate: string; truck_type: string; }
export interface EarningsState { available: number; pending: number; withdrawn: number; lifetime: number; rateBps: number; feeRule: FeeRule; }

export interface CompanySessionState {
  tenant: TenantContext; loadTenantContext: () => Promise<void>;
  trucks: Truck[]; dispatchTimeline: DispatchEvent[];
  activeNotifications: Array<{ id: string; message: string; timestamp: string; type: 'success' | 'warning' | 'error' | 'info' }>;
  selectedTruck: Truck | null; cameraMode: 'overview' | 'following' | 'navigating';
  fetchFleet: () => Promise<void>; updateTruckStatus: (truckId: string, status: Truck['status']) => void;
  addDispatchEvent: (event: Omit<DispatchEvent, 'id' | 'timestamp'>) => void;
  addNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void; clearNotification: (id: string) => void;
  setSelectedTruck: (truck: Truck | null) => void; setCameraMode: (mode: 'overview' | 'following' | 'navigating') => void;
  subscribeToRealtime: () => () => void; unsubscribeFromRealtime: () => void;
  serviceRequests: any[]; selectedRequest: any | null; isDrawerOpen: boolean;
  fetchServiceRequests: () => Promise<void>; setSelectedRequest: (request: any |null) => void; setIsDrawerOpen: (isOpen: boolean) => void;
  activateService: (requestId: string, zoneId: string, scheduleData: any) => Promise<void>;
  earnings: EarningsState | null; settlements: any[]; payouts: any[]; recipients: any[];
  fetchEarnings: () => Promise<void>; fetchPayouts: () => Promise<void>; fetchRecipients: () => Promise<void>;
  requestPayout: (amount: number, recipientId: string, idempotencyKey: string) => Promise<{ ok: boolean; reason?: string; already?: boolean; minimum?: number; payout_id?: string; status?: string }>;
  executePayout: (payoutId: string) => Promise<{ ok: boolean; status?: string; already?: boolean; reason?: string }>;
  saveRecipient: (payload: { bankCode: string; bankName?: string; accountNumber:string; accountLast4: string; accountName: string; country?: string; currency?: string }) => Promise<{ ok: boolean; error?: string }>;
}

export const useCompanySession = create<CompanySessionState>((set, get) => ({
  tenant: { companyId: null, userId: null, role: null, loaded: false },
  trucks: [], dispatchTimeline: [], activeNotifications: [], selectedTruck: null, cameraMode: 'overview',
  serviceRequests: [], selectedRequest: null, isDrawerOpen: false, earnings: null, settlements: [], payouts: [], recipients: [],

  loadTenantContext: async () => {
    // SEC-3: Always read from auth.users + profiles (server-verified identity)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      set({ tenant: { companyId: null, userId: null, role: null, loaded: true } });
      return;
    }

    // Read profile from server (RLS enforces auth.uid() = id)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Profile not found for authenticated user:', user.id);
      set({ tenant: { companyId: null, userId: user.id, role: null, loaded: true } });
      return;
    }

    const companyId = profile.company_id ? Number(profile.company_id) : null;
    const role = profile.role as UserRole;

    set({ tenant: { companyId, userId: user.id, role, loaded: true } });

    if (companyId) {
      await get().fetchFleet();
      await get().fetchServiceRequests();
      await get().fetchEarnings();
    }
  },

    fetchFleet: async () => {
    const cid = get().tenant.companyId;
    if (!cid) return;
    try {
      // FIX: drivers(full_name) not drivers(name)
      const { data: routes, error } = await supabase.from('routes').select('*, drivers(full_name), trucks(truck_id)').eq('company_id', cid).in('status', ['active', 'paused']).order('created_at', { ascending: false });
      if (error) throw error;
      set({ trucks: (routes || []).map((r: any) => ({ id: r.id, truck_id: r.trucks?.truck_id || 'Unknown', driver_name: r.drivers?.full_name || 'Unknown', status: r.status === 'paused' ? 'paused' : 'on_route', current_route_id: r.id, capacity_percent: 0, completed_stops: r.completed_stops || 0, total_stops: r.total_stops || 0,license_plate: '', truck_type: '' })) });
    } catch (e) { console.error('Error fetching fleet:', e); }
  },
    
  fetchServiceRequests: async () => {
    const cid = get().tenant.companyId;
    if (!cid) return;
    const { data, error } = await supabase.from('service_requests').select(`*, buildings:building_id (address, latitude, longitude, building_type)`).eq('status','pending').order('submitted_at', { ascending: false });
    if (error) console.error('Error fetching requests:', error); else set({ serviceRequests: data || [] });
  },

  fetchPayouts: async () => {
    const cid = get().tenant.companyId;
    if (!cid) return;
    try { const res = await fetch(`/api/company/payouts?companyId=${cid}`); const json = await res.json(); if (json.ok) set({ payouts: json.payouts || [] }); } catch (e) { console.error('fetchPayouts failed:', e); }
  },
  fetchRecipients: async () => {
    const cid = get().tenant.companyId;
    if (!cid) return;
    try { const res = await fetch(`/api/company/recipients?companyId=${cid}`); const json = await res.json(); if (json.ok) set({ recipients: json.recipients || [] }); } catch (e) { console.error('fetchRecipients failed:', e); }
  },

    fetchEarnings: async () => {
    const cid = get().tenant.companyId;
    if (!cid) return;
    try {
      // FIX: Only select columns that exist in haulers table
      const [{ data: hauler }, { data: settings }, { data: txs }] = await Promise.all([
        supabase.from('haulers').select('available_balance, pending_balance, withdrawn_total, lifetime_earnings, commission_bps').eq('id', cid).maybeSingle(),
        supabase.from('platform_settings').select('commission_bps, fee_model, flat_fee, processor_bps, processor_flat, processor_cap').maybeSingle(),
        supabase.from('ledger_transactions').select('*').eq('company_id', cid).eq('type', 'settlement').order('created_at', { ascending: false }).limit(40),
      ]);
      const feeRule: FeeRule = {
        model: (settings?.fee_model ?? 'percent') as FeeRule['model'],
        commissionBps: hauler?.commission_bps ?? settings?.commission_bps ?? 1000, 
        flatFee: settings?.flat_fee ?? 0,
        processorBps: settings?.processor_bps ?? 0, 
        processorFlat: settings?.processor_flat ?? 0,
        processorCap: settings?.processor_cap ?? null,
      };
      set({ earnings: { available: hauler?.available_balance ?? 0, pending: hauler?.pending_balance ?? 0, withdrawn: hauler?.withdrawn_total ?? 0, lifetime: hauler?.lifetime_earnings ?? 0, rateBps: feeRule.commissionBps, feeRule }, settlements: txs || [] });
      await get().fetchPayouts(); await get().fetchRecipients();
    } catch (e) {
      console.warn('fetchEarnings degraded:', e);
      set({ earnings: { available: 0, pending: 0, withdrawn: 0, lifetime: 0, rateBps: 1000, feeRule: { model: 'percent', commissionBps: 1000, flatFee: 0, processorBps: 0, processorFlat: 0, processorCap: null } }, settlements: [] });
    }
  },
  executePayout: async (payoutId) => {
    try {
      const res = await fetch('/api/company/payouts/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payoutId }) });
      const json = await res.json();
      if (json.ok) { await get().fetchEarnings(); if (!json.already && json.status === 'paid') get().addNotification('Payout released to bank.', 'success'); }
      else get().addNotification(json.reason || 'Could not release payout.', 'error');
      return json;
    } catch (e: any) { get().addNotification('Could not release payout.', 'error'); return { ok: false, reason: e?.message }; }
  },

  requestPayout: async (amount, recipientId, idempotencyKey) => {
    const cid = get().tenant.companyId;
    if (!cid) return { ok:false, reason: 'no_company' };
    try {
      const res = await fetch('/api/company/payouts/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: cid, amount, recipientId, idempotencyKey }) });
      const json = await res.json();
      if (json.ok) {
        await get().fetchEarnings();
        get().addNotification(json.already ? 'Payout request already recorded.' : 'Payout requested — releasing…', json.already ? 'info' : 'success');
        if (!json.already && json.payout_id) { try { await get().executePayout(json.payout_id); } catch {} }
      } else get().addNotification(json.reason === 'insufficient_available' ? 'Not enough available balance.' : json.reason === 'below_minimum' ? `Minimum payoutis ₦${(json.minimum || 1000).toLocaleString()}.` : 'Could not request payout.', 'error');
      return json;
    } catch (e: any) { get().addNotification('Could not request payout.', 'error'); return { ok: false, reason: e?.message }; }
  },

  saveRecipient: async (payload) => {
    const cid = get().tenant.companyId;
    if (!cid) return { ok:false, error: 'no_company' };
    try {
      const res = await fetch('/api/company/recipients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: cid, ...payload }) });
      const json = await res.json();
      if (json.ok) { await get().fetchRecipients(); get().addNotification('Bank account saved.', 'success'); }
      return json;
    } catch (e: any) { return { ok: false, error: e?.message }; }
  },

     activateService: async (requestId, zoneId, scheduleData) => {
    const cid = get().tenant.companyId; if (!cid) return;
    const { data: haulerRow } = await supabase.from('haulers').select('*').eq('id', cid).maybeSingle();
    if (haulerRow && !canOperate(haulerRow)) { get().addNotification('Confirm your email and complete your profile before accepting buildings.', 'warning'); return; }
    try {
      const { data: request } = await supabase.from('service_requests').select('building_id').eq('id', requestId).single();
      if (!request) throw new Error('Request not found');
      
      // FIX: Look up zone_name from the UUID before inserting
      const { data: zone } = await supabase
        .from('company_zones')
        .select('zone_name')
        .eq('id', zoneId)
        .eq('company_id', cid)
        .single();
      
      if (!zone) throw new Error('Zone not found');
      
      const now = new Date().toISOString();
      await supabase.from('service_requests').update({ status: 'activated', company_id: cid, activated_at: now }).eq('id', requestId);
      await supabase.from('service_assignments').insert([{ 
        building_id: request.building_id, 
        company_id: cid, 
        zone_id: zone.zone_name,  // ← Store zone_name, not UUID
        schedule_template: scheduleData.frequency, 
        pickup_days: scheduleData.days, 
        time_window: scheduleData.timeWindow, 
        service_status: 'active', 
        activated_at: now 
      }]);
      await supabase.from('collection_schedules').insert([{ company_id: cid, building_id: request.building_id, frequency: scheduleData.frequency, pickup_day: scheduleData.days.join(', '), time_window: scheduleData.timeWindow, is_active: true }]);
      await supabase.from('Buildings').update({ company_id: cid, status: 'active' }).eq('custom_id', request.building_id);
      const { data: hauler } = await supabase.from('haulers').select('contact_number').eq('id', cid).maybeSingle();
      await supabase.from('company_profiles').upsert({ id: cid, contact_numbers:hauler?.contact_number ? [{ type: 'call', label: 'Main Line', value: hauler.contact_number }] : [] }, { onConflict: 'id', ignoreDuplicates: true });
      await supabase.from('environmental_issue_history').insert([{ issue_id: null, action: 'SERVICE_ACTIVATED', performed_by: `company_${cid}`, metadata: { request_id: requestId, building_id: request.building_id } }]);
      get().addDispatchEvent({ type: 'service_activated', truck_id: 'N/A', driver_name: 'System', building_id: request.building_id, message: `Service activated for building ${request.building_id}` });
      await get().fetchServiceRequests(); get().setIsDrawerOpen(false); get().addNotification('Service activated successfully!', 'success');
    } catch (e) { console.error('Activation failed:', e); get().addNotification('Failed to activate service.', 'error'); }
  },

  updateTruckStatus: (truckId, status) => set((s) => ({ trucks: s.trucks.map((t)=> (t.id === truckId ? { ...t, status } : t)) })),
  addDispatchEvent: (event) => { const e: DispatchEvent = { ...event, id: `event-${Date.now()}`, timestamp: new Date().toISOString() }; set((s) => ({ dispatchTimeline: [e, ...s.dispatchTimeline].slice(0, 100) })); },
  addNotification: (message, type) => { const n = { id: `notif-${Date.now()}`, message, timestamp: new Date().toISOString(), type }; set((s) => ({ activeNotifications: [n, ...s.activeNotifications].slice(0, 10) })); setTimeout(() => get().clearNotification(n.id), 5000); },
  clearNotification: (id) => set((s) => ({ activeNotifications: s.activeNotifications.filter((n) => n.id !== id) })),
  setSelectedTruck: (truck) => set({ selectedTruck: truck }), setCameraMode: (mode) => set({ cameraMode: mode }),
  setSelectedRequest: (request) => set({ selectedRequest: request }), setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

  
    subscribeToRealtime: () => {
    const cid = get().tenant.companyId;
    if (!cid) return () =>{};
    
    const routeSub = supabase.channel('routes-channel').on('postgres_changes', {event: '*', schema: 'public', table: 'routes', filter: `company_id=eq.${cid}` },(p) => { const n = p.new as any; get().updateTruckStatus(n.route_id, n.status === 'paused' ? 'paused' : n.status === 'completed' ? 'completed' : 'on_route'); }).subscribe();
    
    const ledgerSub = supabase.channel(`company-ledger-${cid}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ledger_transactions', filter:`company_id=eq.${cid}` }, () => { get().fetchEarnings(); }).subscribe();
    
    const payoutSub = supabase.channel(`company-payouts-${cid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'payouts', filter: `company_id=eq.${cid}` }, () => { get().fetchPayouts(); get().fetchEarnings(); }).subscribe();
    
    // FIX: Subscribe to Buildings table changes so newly-accepted buildings appear live
    const buildingsSub = supabase.channel(`company-buildings-${cid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'Buildings', filter: `company_id=eq.${cid}` }, () => {
      // Trigger a refetch of the parent's buildings data
      // The parent page.tsx has a fetchData function that we need to call
      // Since we can't call it directly, we'll use a custom event
      window.dispatchEvent(new CustomEvent('trakbin-buildings-changed'));
    }).subscribe();
    
    return () => { 
      supabase.removeChannel(routeSub); 
      supabase.removeChannel(ledgerSub); 
      supabase.removeChannel(payoutSub);
      supabase.removeChannel(buildingsSub);
    };
  },
  unsubscribeFromRealtime: () => { supabase.removeAllChannels(); },
}));