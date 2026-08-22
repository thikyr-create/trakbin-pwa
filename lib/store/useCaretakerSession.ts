"use client";

import { create } from 'zustand';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { settleKey, topupKey } from '@/lib/utils/money';

const supabase = supabaseBrowser;

export interface CaretakerContact { type: 'call' | 'whatsapp' | 'emergency' | 'office' | 'email'; label: string; value: string; }

export interface CaretakerSessionState {
  building: any | null;
  collectionHistory: any[];
  fullHistory: any[];
  fullHistoryLoaded: boolean;
  walletBalance: number;
  paymentMethods: any[];
  schedule: any | null;
  invoices: any[];
  invoiceCount: { paid: number; due: number };
  platformFeeBps: number | null;
  issues: any[];
  activeAssignment: any | null;
  companyProfile: any | null;
  companyContacts: CaretakerContact[];
  ledger: any[];

  showAddFunds: boolean;
  showAutopay: boolean;
  autopaySource: 'wallet' | 'card';
  autopayLoading: boolean;
  selectedMethod: string;
  loading: boolean;
  billingProcessing: boolean;

  initializeSession: () => Promise<void>;
  refreshAll: () => Promise<void>;
  fetchFullHistory: (force?: boolean) => Promise<void>;
  fetchLedger: () => Promise<void>;
  payInvoice: (invoiceId: string | number) => Promise<{ ok: boolean; reason?: string; already?: boolean; gross?: number; commission?: number; net?: number; commission_bps?: number }>;
  subscribeRealtime: () => void;
  teardownRealtime: () => void;
  fetchIssues: () => Promise<void>;
  createIssue: (issueData: any) => Promise<{ ok: boolean; error?: string; message?: string }>;
  checkAndGenerateInvoice: (bId: string, nextBillingDate: string, autopayEnabled: boolean, currentWalletBalance: number) => Promise<void>;
  addFunds: (amount: number, methodId: string) => Promise<void>;
  saveAutopay: () => Promise<void>;
  disableAutopay: () => Promise<void>;
  setShowAddFunds: (show: boolean) => void;
  setShowAutopay: (show: boolean) => void;
  setAutopaySource: (source: 'wallet' | 'card') => void;
  setSelectedMethod: (method: string) => void;
  logout: () => void;
}

let realtimeCleanup: (() => void) | null = null;

function synthesizeContacts(company: any | null, profile: any | null): CaretakerContact[] {
  const list: CaretakerContact[] = [];
  const seen = new Set<string>();
  const push = (c: CaretakerContact) => {
    const key = `${c.type}:${String(c.value).replace(/\s/g, '')}`;
    if (!c.value || seen.has(key)) return;
    seen.add(key); list.push(c);
  };
  if (Array.isArray(profile?.contact_numbers)) profile.contact_numbers.forEach((c: any) => { if (c?.value) push({ type: c.type || 'call', label: c.label || 'Contact', value: String(c.value) }); });
  if (profile?.whatsapp_number) push({ type: 'whatsapp', label: 'WhatsApp', value: String(profile.whatsapp_number) });
  if (profile?.support_email) push({ type: 'email', label: 'Support Email', value: String(profile.support_email) });
  if (list.length === 0 && company?.contact_number) push({ type: 'call', label: 'Main Line', value: String(company.contact_number) });
  return list;
}

export const useCaretakerSession = create<CaretakerSessionState>((set, get) => ({
  building: null, collectionHistory: [], fullHistory: [], fullHistoryLoaded: false, walletBalance: 0,
  paymentMethods: [], schedule: null, invoices: [], invoiceCount: { paid: 0, due: 0 }, platformFeeBps: null,
  issues: [], activeAssignment: null, companyProfile: null, companyContacts: [], ledger: [],
  showAddFunds: false, showAutopay: false, autopaySource: 'wallet', autopayLoading: false,
  selectedMethod: '', loading: true, billingProcessing: false,

  initializeSession: async () => {
    // Caretakers have REAL Supabase sessions (Building ID identity)
        const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('trakbin_caretaker') : null;

    const buildingId = user?.user_metadata?.building_id ||
      (stored ? (JSON.parse(stored) as any)?.custom_id : null);

    if (!buildingId) {
      window.location.href = '/auth';
      return;
    }

    // RLS scopes this read to the caretaker's own building via get_caretaker_building()
    const { data: building, error } = await supabase
      .from('Buildings')
      .select('*')
      .eq('custom_id', buildingId)
      .maybeSingle();

    if (error || !building) {
      localStorage.removeItem('trakbin_caretaker');
      window.location.href = '/auth';
      return;
    }

    set({ building, loading: true });

    if (building.next_billing_date) {
      await get().checkAndGenerateInvoice(building.custom_id, building.next_billing_date, building.autopay_enabled, building.wallet_balance || 0);
    }
        await Promise.all([get().refreshAll(), get().fetchFullHistory(), get().fetchLedger()]);

    get().teardownRealtime();
    get().subscribeRealtime();
  },

  refreshAll: async () => {
    const building = get().building;
    if (!building) return;
    const bId = building.custom_id;

    const [historyRes, methodsRes, scheduleRes, invoicesRes, assignmentRes, settingsRes, buildingRes] = await Promise.all([
      supabase.from('collections').select('*').eq('building_id', bId).order('collection_date', { ascending: false }).limit(10),
      supabase.from('payment_methods').select('*').eq('building_id', bId),
      supabase.from('collection_schedules').select('*').eq('building_id', bId),
      supabase.from('invoices').select('*').eq('building_id', bId).order('due_date', { ascending: false }),
      supabase.from('service_assignments').select('*').eq('building_id', bId).eq('service_status', 'active').maybeSingle(),
      supabase.from('platform_settings').select('commission_bps').maybeSingle(),
      supabase.from('Buildings').select('wallet_balance, autopay_enabled, autopay_source, payment_status, next_billing_date, company_id').eq('custom_id', bId).maybeSingle(),
    ]);

    if (historyRes.data) set({ collectionHistory: historyRes.data });
    if (methodsRes.data) set({ paymentMethods: methodsRes.data });
    set({ schedule: scheduleRes.data && scheduleRes.data.length > 0 ? scheduleRes.data[0] : null });

    const inv = invoicesRes.data || [];
    set({
      invoices: inv,
      invoiceCount: { paid: inv.filter((i) => i.status === 'paid').length, due: inv.filter((i) => i.status !== 'paid').length },
    });

    if (buildingRes.data) {
      set({ walletBalance: buildingRes.data.wallet_balance ?? 0 });
      set((s) => ({ building: s.building ? { ...s.building, ...buildingRes.data } : s.building }));
    }

    let companyCommissionBps: number | null = null;
    if (assignmentRes.data) {
      const [companyRes, profileRes] = await Promise.all([
        supabase.from('haulers').select('*').eq('id', assignmentRes.data.company_id).maybeSingle(),
        supabase.from('company_profiles').select('*').eq('id', assignmentRes.data.company_id).maybeSingle(),
      ]);
      companyCommissionBps = companyRes.data?.commission_bps ?? null;
      set({ activeAssignment: assignmentRes.data, companyProfile: companyRes.data, companyContacts: synthesizeContacts(companyRes.data, profileRes.data) });
    } else set({ activeAssignment: null, companyProfile: null, companyContacts: [] });

    set({ platformFeeBps: companyCommissionBps ?? settingsRes.data?.commission_bps ?? 1000 });

    await get().fetchIssues();
    set({ loading: false });
  },

  fetchFullHistory: async (force = false) => {
    if (!force && get().fullHistoryLoaded) return;
    const building = get().building; if (!building) return;
    const { data } = await supabase.from('collections').select('*').eq('building_id', building.custom_id).order('collection_date', { ascending: false });
    if (data) set({ fullHistory: data, fullHistoryLoaded: true });
  },

  fetchLedger: async () => {
    const building = get().building; if (!building) return;
    const { data } = await supabase.from('ledger_transactions').select('*').eq('building_id', building.custom_id).order('created_at', { ascending: false }).limit(40);
    if (data) set({ ledger: data });
  },

  payInvoice: async (invoiceId) => {
    const building = get().building;
    if (!building) return { ok: false, reason: 'no_session' };
    const { data, error } = await supabase.rpc('settle_invoice', {
      p_invoice_id: String(invoiceId), p_idempotency_key: settleKey(invoiceId), p_source: 'wallet',
    });
    if (error) { console.error('settle_invoice error:', error); return { ok: false, reason: 'rpc_error' }; }
    const res = (data || {}) as any;
    if (res.ok) { await get().refreshAll(); await get().fetchLedger(); }
    return res;
  },

  subscribeRealtime: () => {
    const building = get().building; if (!building) return;
    const bId = building.custom_id;
    const channel = supabase.channel(`caretaker-${bId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_assignments', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_schedules', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); get().fetchFullHistory(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_transactions', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); get().fetchLedger(); })
      // FIX: Watch the building row itself. When a company accepts (company_id updates),
      // the caretaker's local state refreshes instantly → Report tab unlocks live.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Buildings', filter: `custom_id=eq.${bId}` }, async () => {
        const { data: updated } = await supabase.from('Buildings').select('*').eq('custom_id', bId).maybeSingle();
        if (updated) {
          set({ building: updated });
          await get().refreshAll();
        }
      })
      .subscribe();
    realtimeCleanup = () => { supabase.removeChannel(channel); };
  },
  teardownRealtime: () => { if (realtimeCleanup) { realtimeCleanup(); realtimeCleanup = null; } },

  fetchIssues: async () => {
    const { building } = get(); if (!building) return;
    const { data } = await supabase.from('environmental_issues').select('*').eq('building_id', building.custom_id).order('created_at', { ascending: false });
    if (data) set({ issues: data });
  },

  createIssue: async (issueData: any) => {
    const { building, fetchIssues } = get();

    if (!building?.company_id) {
      return {
        ok: false,
        error: 'unassigned',
        message: 'Reports can only be submitted after a waste company has been assigned to your building.',
      };
    }

    try {
      const issue_number = `ENV-${Date.now().toString().slice(-6)}`;
      const { error } = await supabase.from('environmental_issues').insert([{
        ...issueData,
        issue_number,
        building_id: building.custom_id,
        reported_by: building.custom_id,
        company_id: building.company_id,
      }]);
      if (error) throw error;
      await fetchIssues();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message };
    }
  },

  checkAndGenerateInvoice: async (bId, nextBillingDate, autopayEnabled, currentWalletBalance) => {
    const today = new Date().toISOString().split('T')[0];
    if (today >= nextBillingDate) {
      set({ billingProcessing: true });
      const invoiceAmount = 7500;
      const billingDate = new Date(nextBillingDate);
      const followingMonth = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 1);
      const monthLabel = billingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const { data: newInv } = await supabase.from('invoices').insert([{ building_id: bId, amount: invoiceAmount, due_date: nextBillingDate, status: 'pending', description: `Monthly Waste Collection - ${monthLabel}` }]).select('id').single();
      await supabase.from('Buildings').update({ next_billing_date: followingMonth.toISOString().split('T')[0], payment_status: 'unpaid' }).eq('custom_id', bId);

      let paidByAutopay = false;
      if (autopayEnabled && newInv?.id) {
        const res = await get().payInvoice(newInv.id);
        paidByAutopay = !!res.ok;
        if (res.ok && !res.already) alert(`✅ Autopay settled — ${monthLabel}. Provider credited, platform fee applied.`);
        else if (!res.ok && res.reason === 'insufficient_wallet') alert(`⚠️ Autopay skipped: insufficient wallet balance.`);
        else if (!res.ok && res.reason === 'no_provider_assigned') alert(`⚠️ Autopay held: no waste provider assigned yet — invoice stays pending.`);
      }

      set((state) => ({
        building: { ...state.building, next_billing_date: followingMonth.toISOString().split('T')[0], payment_status: paidByAutopay ? 'paid' : 'unpaid' },
        billingProcessing: false,
      }));
    }
  },

  addFunds: async (amount, methodId) => {
    const { building, walletBalance } = get(); if (!building) return;
    const nonce = Date.now();
    const { data, error } = await supabase.rpc('record_topup', {
      p_building_id: building.custom_id, p_amount: Math.trunc(amount), p_idempotency_key: topupKey(building.custom_id, nonce),
    });
    if (error || !(data as any)?.ok) { alert('Top-up failed. Please try again.'); return; }
    set({ walletBalance: (data as any).new_balance ?? walletBalance + amount, showAddFunds: false, selectedMethod: '' });
    await get().fetchLedger();
    alert('Funds added successfully!');
  },

  saveAutopay: async () => {
    const { building, autopaySource } = get(); if (!building) return;
    set({ autopayLoading: true });
    await supabase.from('Buildings').update({ autopay_enabled: true, autopay_source: autopaySource }).eq('custom_id', building.custom_id);
    await get().refreshAll();
    set({ autopayLoading: false, showAutopay: false });
    alert(`✅ Autopay enabled! We will automatically settle from your ${autopaySource} on the 1st of every month.`);
  },

  disableAutopay: async () => {
    const { building } = get(); if (!building) return;
    await supabase.from('Buildings').update({ autopay_enabled: false }).eq('custom_id', building.custom_id);
    await get().refreshAll();
  },

  setShowAddFunds: (show) => set({ showAddFunds: show }),
  setShowAutopay: (show) => set({ showAutopay: show }),
  setAutopaySource: (source) => set({ autopaySource: source }),
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  logout: () => {
    get().teardownRealtime();
    localStorage.removeItem('trakbin_caretaker');
    supabase.auth.signOut().catch(() => {});
    window.location.href = '/';
  },
}));