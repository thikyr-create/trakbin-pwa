import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface CaretakerContact {
  type: 'call' | 'whatsapp' | 'emergency' | 'office' | 'email';
  label: string;
  value: string;
}

export interface CaretakerSessionState {
  building: any | null;
  collectionHistory: any[];
  fullHistory: any[];
  fullHistoryLoaded: boolean;
  walletBalance: number;
  paymentMethods: any[];
  schedule: any | null;
  invoiceCount: { paid: number; due: number };
  issues: any[];
  activeAssignment: any | null;
  companyProfile: any | null;
  companyContacts: CaretakerContact[];

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
  subscribeRealtime: () => void;
  teardownRealtime: () => void;
  fetchIssues: () => Promise<void>;
  createIssue: (issueData: any) => Promise<void>;
  checkAndGenerateInvoice: (bId: string, nextBillingDate: string, autopayEnabled: boolean, currentWalletBalance: number) => Promise<void>;
  addFunds: (amount: number, methodId: string) => Promise<void>;
  saveAutopay: () => Promise<void>;
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
    seen.add(key);
    list.push(c);
  };
  if (Array.isArray(profile?.contact_numbers)) {
    profile.contact_numbers.forEach((c: any) => {
      if (c?.value) push({ type: c.type || 'call', label: c.label || 'Contact', value: String(c.value) });
    });
  }
  if (profile?.whatsapp_number) push({ type: 'whatsapp', label: 'WhatsApp', value: String(profile.whatsapp_number) });
  if (profile?.support_email) push({ type: 'email', label: 'Support Email', value: String(profile.support_email) });
  if (list.length === 0 && company?.contact_number) push({ type: 'call', label: 'Main Line', value: String(company.contact_number) });
  return list;
}

export const useCaretakerSession = create<CaretakerSessionState>((set, get) => ({
  building: null,
  collectionHistory: [],
  fullHistory: [],
  fullHistoryLoaded: false,
  walletBalance: 0,
  paymentMethods: [],
  schedule: null,
  invoiceCount: { paid: 0, due: 0 },
  issues: [],
  activeAssignment: null,
  companyProfile: null,
  companyContacts: [],
  showAddFunds: false,
  showAutopay: false,
  autopaySource: 'wallet',
  autopayLoading: false,
  selectedMethod: '',
  loading: true,
  billingProcessing: false,

  initializeSession: async () => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (!storedCaretaker) { window.location.href = '/auth'; return; }
    const caretakerData = JSON.parse(storedCaretaker);

    set({ building: caretakerData, loading: true });

    if (caretakerData.next_billing_date) {
      await get().checkAndGenerateInvoice(
        caretakerData.custom_id,
        caretakerData.next_billing_date,
        caretakerData.autopay_enabled,
        caretakerData.wallet_balance || 0
      );
    }

    await get().refreshAll();
    await get().fetchFullHistory(); // DELTA: the full record is part of session init now

    get().teardownRealtime();
    get().subscribeRealtime();
  },

  refreshAll: async () => {
    const building = get().building;
    if (!building) return;
    const bId = building.custom_id;

    const [historyRes, methodsRes, scheduleRes, invoicesRes, assignmentRes] = await Promise.all([
      supabase.from('collections').select('*').eq('building_id', bId).order('collection_date', { ascending: false }).limit(10),
      supabase.from('payment_methods').select('*').eq('building_id', bId),
      supabase.from('collection_schedules').select('*').eq('building_id', bId),
      supabase.from('invoices').select('status').eq('building_id', bId),
      supabase.from('service_assignments').select('*').eq('building_id', bId).eq('service_status', 'active').maybeSingle(),
    ]);

    if (historyRes.data) set({ collectionHistory: historyRes.data });
    if (methodsRes.data) set({ paymentMethods: methodsRes.data });
    set({ schedule: scheduleRes.data && scheduleRes.data.length > 0 ? scheduleRes.data[0] : null });
    if (invoicesRes.data) {
      set({
        invoiceCount: {
          paid: invoicesRes.data.filter((i) => i.status === 'paid').length,
          due: invoicesRes.data.filter((i) => i.status !== 'paid').length,
        },
      });
    }

    if (assignmentRes.data) {
      const [companyRes, profileRes] = await Promise.all([
        supabase.from('haulers').select('*').eq('id', assignmentRes.data.company_id).maybeSingle(),
        supabase.from('company_profiles').select('*').eq('id', assignmentRes.data.company_id).maybeSingle(),
      ]);
      set({
        activeAssignment: assignmentRes.data,
        companyProfile: companyRes.data,
        companyContacts: synthesizeContacts(companyRes.data, profileRes.data),
      });
    } else {
      set({ activeAssignment: null, companyProfile: null, companyContacts: [] });
    }

    await get().fetchIssues();
    set({ loading: false });
  },

  // DELTA: guarded so the history tab's own call no-ops after init, while
  // Realtime passes force=true to keep the record live.
  fetchFullHistory: async (force = false) => {
    if (!force && get().fullHistoryLoaded) return;
    const building = get().building;
    if (!building) return;
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('building_id', building.custom_id)
      .order('collection_date', { ascending: false });
    if (data) set({ fullHistory: data, fullHistoryLoaded: true });
  },

  subscribeRealtime: () => {
    const building = get().building;
    if (!building) return;
    const bId = building.custom_id;

    const channel = supabase
      .channel(`caretaker-${bId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_assignments', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_schedules', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `building_id=eq.${bId}` }, () => { get().refreshAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections', filter: `building_id=eq.${bId}` }, () => {
        get().refreshAll();
        get().fetchFullHistory(true); // DELTA: always refresh the record on a new pickup
      })
      .subscribe();

    realtimeCleanup = () => { supabase.removeChannel(channel); };
  },

  teardownRealtime: () => {
    if (realtimeCleanup) { realtimeCleanup(); realtimeCleanup = null; }
  },

  fetchIssues: async () => {
    const { building } = get();
    if (!building) return;
    const { data } = await supabase.from('environmental_issues').select('*').eq('building_id', building.custom_id).order('created_at', { ascending: false });
    if (data) set({ issues: data });
  },

  createIssue: async (issueData) => {
    const { building } = get();
    if (!building) return;
    const issueNumber = `ENV-${Date.now().toString().slice(-6)}`;
    const { data: newIssue, error } = await supabase.from('environmental_issues').insert([{ ...issueData, issue_number: issueNumber, building_id: building.custom_id, reported_by: building.custom_id, company_id: building.company_id || null }]).select().single();
    if (error) { console.error('Error creating issue:', error); alert('Failed to submit report.'); }
    else {
      await supabase.from('environmental_issue_history').insert([{ issue_id: newIssue.id, action: 'REPORT_CREATED', performed_by: 'caretaker', metadata: { type: issueData.issue_type } }]);
      alert(`Report Submitted! ID: ${issueNumber}`);
      await get().fetchIssues();
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

      await supabase.from('invoices').insert([{ building_id: bId, amount: invoiceAmount, due_date: nextBillingDate, status: 'pending', description: `Monthly Waste Collection - ${monthLabel}` }]);
      await supabase.from('Buildings').update({ next_billing_date: followingMonth.toISOString().split('T')[0], payment_status: 'unpaid' }).eq('custom_id', bId);

      if (autopayEnabled && currentWalletBalance >= invoiceAmount) {
        const newBalance = currentWalletBalance - invoiceAmount;
        await supabase.from('Buildings').update({ wallet_balance: newBalance, payment_status: 'paid' }).eq('custom_id', bId);
        await supabase.from('wallet_transactions').insert([{ building_id: bId, type: 'payment', amount: invoiceAmount, description: `Autopay: ${monthLabel}`, status: 'completed' }]);
        await supabase.from('invoices').update({ status: 'paid' }).eq('building_id', bId).eq('due_date', nextBillingDate);
        set({ walletBalance: newBalance });
      }

      set((state) => ({
        building: { ...state.building, next_billing_date: followingMonth.toISOString().split('T')[0], payment_status: autopayEnabled && currentWalletBalance >= invoiceAmount ? 'paid' : 'unpaid' },
        billingProcessing: false,
      }));
    }
  },

  addFunds: async (amount, methodId) => {
    const { building, walletBalance } = get();
    if (!building) return;
    await supabase.from('wallet_transactions').insert([{ building_id: building.custom_id, type: 'deposit', amount, description: 'Wallet top-up', status: 'completed' }]);
    const newBalance = walletBalance + amount;
    await supabase.from('Buildings').update({ wallet_balance: newBalance }).eq('custom_id', building.custom_id);
    set({ walletBalance: newBalance, showAddFunds: false, selectedMethod: '' });
    alert('Funds added successfully!');
  },

  saveAutopay: async () => {
    const { building, autopaySource } = get();
    if (!building) return;
    set({ autopayLoading: true });
    await supabase.from('Buildings').update({ autopay_enabled: true, autopay_source: autopaySource }).eq('custom_id', building.custom_id);
    set({ autopayLoading: false, showAutopay: false });
    alert(`✅ Autopay enabled! We will automatically deduct from your ${autopaySource} on the 1st of every month.`);
  },

  setShowAddFunds: (show) => set({ showAddFunds: show }),
  setShowAutopay: (show) => set({ showAutopay: show }),
  setAutopaySource: (source) => set({ autopaySource: source }),
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  logout: () => { get().teardownRealtime(); localStorage.removeItem('trakbin_caretaker'); window.location.href = '/'; },
}));