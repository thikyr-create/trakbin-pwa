import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { useCompanySession } from '@/lib/store/useCompanySession';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface CaretakerSessionState {
  // State
  building: any | null;
  collectionHistory: any[];
  walletBalance: number;
  paymentMethods: any[];
  schedule: any | null;
  invoiceCount: { paid: number; due: number };
  
  showAddFunds: boolean;
  showAutopay: boolean;
  autopaySource: 'wallet' | 'card';
  autopayLoading: boolean;
  selectedMethod: string;
  loading: boolean;
  billingProcessing: boolean;

  // Actions
  initializeSession: () => Promise<void>;
  checkAndGenerateInvoice: (bId: string, nextBillingDate: string, autopayEnabled: boolean, currentWalletBalance: number) => Promise<void>;
  addFunds: (amount: number, methodId: string) => Promise<void>;
  saveAutopay: () => Promise<void>;
  setShowAddFunds: (show: boolean) => void;
  setShowAutopay: (show: boolean) => void;
  setAutopaySource: (source: 'wallet' | 'card') => void;
  setSelectedMethod: (method: string) => void;
  logout: () => void;
}

export const useCaretakerSession = create<CaretakerSessionState>((set, get) => ({
  building: null,
  collectionHistory: [],
  walletBalance: 0,
  paymentMethods: [],
  schedule: null,
  invoiceCount: { paid: 0, due: 0 },
  showAddFunds: false,
  showAutopay: false,
  autopaySource: 'wallet',
  autopayLoading: false,
  selectedMethod: '',
  loading: true,
  billingProcessing: false,

  initializeSession: async () => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (!storedCaretaker) { 
      window.location.href = '/auth'; 
      return; 
    }
    const caretakerData = JSON.parse(storedCaretaker);
    
    // Get tenant context for RLS scoping
    const { tenant } = useCompanySession.getState();
    if (!tenant || !tenant.companyId) {
      console.error('Tenant context not loaded.');
      return;
    }

    set({ building: caretakerData, loading: true });

    try {
      // 1. Fetch Collection History (Scoped to Company)
      const { data: history } = await supabase
        .from('collections')
        .select('*')
        .eq('building_id', caretakerData.custom_id)
        .eq('company_id', tenant.companyId) // <-- RLS SCOPE
        .order('collection_date', { ascending: false })
        .limit(10);
      if (history) set({ collectionHistory: history });

      // 2. Fetch Building Data (Scoped to Company)
      const { data: buildingData } = await supabase
        .from('Buildings')
        .select('wallet_balance, autopay_enabled, autopay_source, next_billing_date, payment_status')
        .eq('custom_id', caretakerData.custom_id)
        .eq('company_id', tenant.companyId) // <-- RLS SCOPE
        .single();
        
      if (buildingData) {
        set({ 
          walletBalance: buildingData.wallet_balance || 0,
          autopaySource: buildingData.autopay_source || 'wallet',
          building: { ...caretakerData, ...buildingData }
        });

        // Trigger billing check if date is due
        if (buildingData.next_billing_date) {
          await get().checkAndGenerateInvoice(
            caretakerData.custom_id, 
            buildingData.next_billing_date, 
            buildingData.autopay_enabled, 
            buildingData.wallet_balance || 0
          );
        }
      }

      // 3. Fetch Payment Methods (Scoped to Company)
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('building_id', caretakerData.custom_id)
        .eq('company_id', tenant.companyId); // <-- RLS SCOPE
      if (methods) set({ paymentMethods: methods });

      // 4. Fetch Schedule (Scoped to Company)
      const { data: scheduleData } = await supabase
        .from('collection_schedules')
        .select('*')
        .eq('building_id', caretakerData.custom_id)
        .eq('company_id', tenant.companyId); // <-- RLS SCOPE
      if (scheduleData && scheduleData.length > 0) set({ schedule: scheduleData[0] });

      // 5. Fetch Invoices (Scoped to Company)
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('status')
        .eq('building_id', caretakerData.custom_id)
        .eq('company_id', tenant.companyId); // <-- RLS SCOPE
        
      if (allInvoices) {
        set({
          invoiceCount: {
            paid: allInvoices.filter(i => i.status === 'paid').length,
            due: allInvoices.filter(i => i.status !== 'paid').length
          }
        });
      }
    } catch (error) {
      console.error('Error initializing caretaker session:', error);
    } finally {
      set({ loading: false });
    }
  },

  checkAndGenerateInvoice: async (bId, nextBillingDate, autopayEnabled, currentWalletBalance) => {
    const today = new Date().toISOString().split('T')[0];
    if (today >= nextBillingDate) {
      set({ billingProcessing: true });
      const { tenant } = useCompanySession.getState();
      if (!tenant?.companyId) return;

      const invoiceAmount = 7500;
      const billingDate = new Date(nextBillingDate);
      const followingMonth = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 1);
      const monthLabel = billingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Insert Invoice (Scoped)
      await supabase.from('invoices').insert([{ 
        building_id: bId, 
        company_id: tenant.companyId, // <-- RLS SCOPE
        amount: invoiceAmount, 
        due_date: nextBillingDate, 
        status: 'pending', 
        description: `Monthly Waste Collection - ${monthLabel}` 
      }]);
      
      // Update Building Billing Date (Scoped)
      await supabase.from('Buildings').update({ 
        next_billing_date: followingMonth.toISOString().split('T')[0], 
        payment_status: 'unpaid' 
      }).eq('custom_id', bId).eq('company_id', tenant.companyId);

      // Process Autopay if enabled
      if (autopayEnabled && currentWalletBalance >= invoiceAmount) {
        const newBalance = currentWalletBalance - invoiceAmount;
        
        await supabase.from('Buildings').update({ 
          wallet_balance: newBalance, 
          payment_status: 'paid' 
        }).eq('custom_id', bId).eq('company_id', tenant.companyId);
        
        await supabase.from('wallet_transactions').insert([{ 
          building_id: bId, 
          company_id: tenant.companyId, // <-- RLS SCOPE
          type: 'payment', 
          amount: invoiceAmount, 
          description: `Autopay: ${monthLabel}`, 
          status: 'completed' 
        }]);
        
        await supabase.from('invoices').update({ status: 'paid' })
          .eq('building_id', bId)
          .eq('due_date', nextBillingDate)
          .eq('company_id', tenant.companyId); // <-- RLS SCOPE
          
        set({ walletBalance: newBalance });
        alert(`✅ Autopay successful! ₦${invoiceAmount.toLocaleString()} deducted for ${monthLabel}.`);
      } else if (autopayEnabled && currentWalletBalance < invoiceAmount) {
        alert(`⚠️ Autopay failed: Insufficient wallet balance.`);
      }

      set((state) => ({ 
        building: { 
          ...state.building, 
          next_billing_date: followingMonth.toISOString().split('T')[0], 
          payment_status: autopayEnabled && currentWalletBalance >= invoiceAmount ? 'paid' : 'unpaid' 
        },
        billingProcessing: false 
      }));
    }
  },

  addFunds: async (amount, methodId) => {
    const { building, walletBalance } = get();
    const { tenant } = useCompanySession.getState();
    if (!building || !tenant?.companyId) return;

    await supabase.from('wallet_transactions').insert([{ 
      building_id: building.custom_id, 
      company_id: tenant.companyId, // <-- RLS SCOPE
      type: 'deposit', 
      amount, 
      description: 'Wallet top-up', 
      status: 'completed' 
    }]);
    
    const newBalance = walletBalance + amount;
    await supabase.from('Buildings').update({ wallet_balance: newBalance })
      .eq('custom_id', building.custom_id)
      .eq('company_id', tenant.companyId); // <-- RLS SCOPE
      
    set({ walletBalance: newBalance, showAddFunds: false, selectedMethod: '' });
    alert('Funds added successfully!');
  },

  saveAutopay: async () => {
    const { building, autopaySource } = get();
    const { tenant } = useCompanySession.getState();
    if (!building || !tenant?.companyId) return;

    set({ autopayLoading: true });
    await supabase.from('Buildings').update({ autopay_enabled: true, autopay_source: autopaySource })
      .eq('custom_id', building.custom_id)
      .eq('company_id', tenant.companyId); // <-- RLS SCOPE
      
    set({ autopayLoading: false, showAutopay: false });
    alert(`✅ Autopay enabled! We will automatically deduct from your ${autopaySource} on the 1st of every month.`);
  },

  setShowAddFunds: (show) => set({ showAddFunds: show }),
  setShowAutopay: (show) => set({ showAutopay: show }),
  setAutopaySource: (source) => set({ autopaySource: source }),
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  
  logout: () => { 
    localStorage.removeItem('trakbin_caretaker'); 
    window.location.href = '/'; 
  },
}));