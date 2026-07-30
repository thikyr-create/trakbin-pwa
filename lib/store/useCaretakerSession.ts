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

// Derive the contact list from the LIVE company profile (referenced, never copied).
// Layered so it works today with zero extra company action, and gets richer later.
function synthesizeContacts(company: any | null, profile: any | null): CaretakerContact[] {
  const list: CaretakerContact[] = [];
  const seen = new Set<string>();
  const push = (c: CaretakerContact) => {
    const key = `${c.type}:${String(c.value).replace(/\s/g, '')}`;
    if (!c.value || seen.has(key)) return;
    seen.add(key);
    list.push(c);
  };

  // 1. Rich, labelled list from the profile (future source of truth)
  if (Array.isArray(profile?.contact_numbers)) {
    profile.contact_numbers.forEach((c: any) => {
      if (c?.value) push({ type: c.type || 'call', label: c.label || 'Contact', value: String(c.value) });
    });
  }
  // 2. Typed columns on the profile, if the company filled them
  if (profile?.whatsapp_number) push({ type: 'whatsapp', label: 'WhatsApp', value: String(profile.whatsapp_number) });
  if (profile?.support_email) push({ type: 'email', label: 'Support Email', value: String(profile.support_email) });

  // 3. Fallback: the single number entered at company signup
  if (list.length === 0 && company?.contact_number) {
    push({ type: 'call', label: 'Main Line', value: String(company.contact_number) });
  }
  return list;
}

export const useCaretakerSession = create<CaretakerSessionState>((set, get) => ({
  building: null,
  collectionHistory: [],
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

    try {
      const { data: history } = await supabase.from('collections').select('*').eq('building_id', caretakerData.custom_id).order('collection_date', { ascending: false }).limit(10);
      if (history) set({ collectionHistory: history });

      const { data: buildingData } = await supabase.from('Buildings').select('wallet_balance, autopay_enabled, autopay_source, next_billing_date, payment_status, company_id').eq('custom_id', caretakerData.custom_id).single();

      if (buildingData) {
        set({ walletBalance: buildingData.wallet_balance || 0, autopaySource: buildingData.autopay_source || 'wallet', building: { ...caretakerData, ...buildingData } });
        if (buildingData.next_billing_date) await get().checkAndGenerateInvoice(caretakerData.custom_id, buildingData.next_billing_date, buildingData.autopay_enabled, buildingData.wallet_balance || 0);
      }

      const { data: methods } = await supabase.from('payment_methods').select('*').eq('building_id', caretakerData.custom_id);
      if (methods) set({ paymentMethods: methods });

      const { data: scheduleData } = await supabase.from('collection_schedules').select('*').eq('building_id', caretakerData.custom_id);
      if (scheduleData && scheduleData.length > 0) set({ schedule: scheduleData[0] });

      const { data: allInvoices } = await supabase.from('invoices').select('status').eq('building_id', caretakerData.custom_id);
      if (allInvoices) {
        set({ invoiceCount: { paid: allInvoices.filter(i => i.status === 'paid').length, due: allInvoices.filter(i => i.status !== 'paid').length } });
      }

      // Active assignment → referenced company profile → synthesized contacts
      const { data: assignment } = await supabase.from('service_assignments').select('*').eq('building_id', caretakerData.custom_id).eq('service_status', 'active').maybeSingle();
      if (assignment) {
        const { data: company } = await supabase.from('haulers').select('*').eq('id', assignment.company_id).maybeSingle();
        const { data: profile } = await supabase.from('company_profiles').select('*').eq('id', assignment.company_id).maybeSingle();
        set({
          activeAssignment: assignment,
          companyProfile: company,
          companyContacts: synthesizeContacts(company, profile),
        });
      }

      await get().fetchIssues();
    } catch (error) { console.error('Error initializing caretaker session:', error); }
    finally { set({ loading: false }); }
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
    if (error) { console.error("Error creating issue:", error); alert("Failed to submit report."); }
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
        alert(`✅ Autopay successful! ₦${invoiceAmount.toLocaleString()} deducted for ${monthLabel}.`);
      } else if (autopayEnabled && currentWalletBalance < invoiceAmount) { alert(`⚠️ Autopay failed: Insufficient wallet balance.`); }

      set((state) => ({ building: { ...state.building, next_billing_date: followingMonth.toISOString().split('T')[0], payment_status: autopayEnabled && currentWalletBalance >= invoiceAmount ? 'paid' : 'unpaid' }, billingProcessing: false }));
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
  logout: () => { localStorage.removeItem('trakbin_caretaker'); window.location.href = '/'; },
}));