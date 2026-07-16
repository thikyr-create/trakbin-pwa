"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, MapPin, Calendar, Truck, LogOut, Phone, CreditCard, ArrowRight, Wallet, Plus, X, Landmark, Loader2, Home } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CaretakerDashboard() {
  const [building, setBuilding] = useState<any>(null);
  const [collectionHistory, setCollectionHistory] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [invoiceCount, setInvoiceCount] = useState({ paid: 0, due: 0 });

  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showAutopay, setShowAutopay] = useState(false);
  const [autopaySource, setAutopaySource] = useState<'wallet' | 'card'>('wallet');
  const [autopayLoading, setAutopayLoading] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [billingProcessing, setBillingProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (!storedCaretaker) { router.push('/auth'); return; }
    const caretakerData = JSON.parse(storedCaretaker);
    setBuilding(caretakerData);

    const fetchData = async () => {
      const { data: history } = await supabase.from('collections').select('*').eq('building_id', caretakerData.custom_id).order('collection_date', { ascending: false }).limit(10);
      if (history) setCollectionHistory(history);

      const { data: buildingData } = await supabase.from('Buildings').select('wallet_balance, autopay_enabled, autopay_source, next_billing_date, payment_status').eq('custom_id', caretakerData.custom_id).single();
      if (buildingData) {
        setWalletBalance(buildingData.wallet_balance || 0);
        if (buildingData.autopay_source) setAutopaySource(buildingData.autopay_source);
        setBuilding((prev: any) => ({ ...prev, ...buildingData }));
      }

      const { data: methods } = await supabase.from('payment_methods').select('*').eq('building_id', caretakerData.custom_id);
      if (methods) setPaymentMethods(methods);

      const { data: scheduleData } = await supabase.from('collection_schedules').select('*').eq('building_id', caretakerData.custom_id).single();
      if (scheduleData) setSchedule(scheduleData);

      const { data: allInvoices } = await supabase.from('invoices').select('status').eq('building_id', caretakerData.custom_id);
      if (allInvoices) {
        setInvoiceCount({
          paid: allInvoices.filter(i => i.status === 'paid').length,
          due: allInvoices.filter(i => i.status !== 'paid').length
        });
      }

      if (buildingData?.next_billing_date) {
        await checkAndGenerateInvoice(caretakerData.custom_id, buildingData.next_billing_date, buildingData.autopay_enabled, buildingData.wallet_balance || 0);
      }

      setLoading(false);
    };
    fetchData();
  }, [router]);

  const checkAndGenerateInvoice = async (bId: string, nextBillingDate: string, autopayEnabled: boolean, currentWalletBalance: number) => {
    const today = new Date().toISOString().split('T')[0];
    if (today >= nextBillingDate) {
      setBillingProcessing(true);
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
        setWalletBalance(newBalance);
        alert(`✅ Autopay successful! ₦${invoiceAmount.toLocaleString()} deducted for ${monthLabel}.`);
      } else if (autopayEnabled && currentWalletBalance < invoiceAmount) {
        alert(`⚠️ Autopay failed: Insufficient wallet balance.`);
      }

      setBuilding((prev: any) => ({ ...prev, next_billing_date: followingMonth.toISOString().split('T')[0], payment_status: autopayEnabled && currentWalletBalance >= invoiceAmount ? 'paid' : 'unpaid' }));
      setBillingProcessing(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('trakbin_caretaker'); router.push('/'); };
  const handleAddFundsClick = () => { if (paymentMethods.length === 0) { alert('Please add a payment method first.'); router.push('/caretaker/payment'); } else { setShowAddFunds(true); } };
  
  const handleConfirmAddFunds = async () => {
    if (!selectedMethod) { alert('Please select a payment method'); return; }
    const amount = prompt('Enter amount to add (₦):');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { alert('Please enter a valid amount'); return; }
    const numAmount = Number(amount);
    await supabase.from('wallet_transactions').insert([{ building_id: building.custom_id, type: 'deposit', amount: numAmount, description: 'Wallet top-up', status: 'completed' }]);
    const newBalance = walletBalance + numAmount;
    await supabase.from('Buildings').update({ wallet_balance: newBalance }).eq('custom_id', building.custom_id);
    setWalletBalance(newBalance); setShowAddFunds(false); setSelectedMethod(''); alert('Funds added successfully!');
  };

  const handleSaveAutopay = async () => {
    setAutopayLoading(true);
    await supabase.from('Buildings').update({ autopay_enabled: true, autopay_source: autopaySource }).eq('custom_id', building.custom_id);
    setAutopayLoading(false); setShowAutopay(false);
    alert(`✅ Autopay enabled! We will automatically deduct from your ${autopaySource} on the 1st of every month.`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  if (!building) return null;

  const isPaid = building.payment_status === 'paid';
  const getStatusInfo = () => {
    if (!schedule) return { status: 'Scheduled', badgeColor: 'bg-gray-100 text-gray-700', icon: '⚪' };
    if (schedule.status === 'delayed') return { status: 'Delayed', badgeColor: 'bg-orange-100 text-orange-700', icon: '🟠' };
    if (schedule.status === 'missed') return { status: 'Missed', badgeColor: 'bg-red-100 text-red-700', icon: '🔴' };
    return { status: 'Scheduled', badgeColor: 'bg-green-100 text-green-700', icon: '🟢' };
  };
  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      {billingProcessing && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg z-[1000] flex items-center gap-2 animate-pulse text-sm font-bold">
          <Loader2 className="w-4 h-4 animate-spin" /> Processing Monthly Billing...
        </div>
      )}

      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xl">T</span></div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Trakbin</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* FLOATING HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent opacity-50"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200"><Home className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back!</h1>
              <p className="text-sm text-gray-500 font-medium">Here's your building's waste collection status</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* 1. BILLING CARD */}
          <div className="group relative bg-white rounded-2xl shadow-sm border border-green-100 p-6 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg hover:border-green-500 cursor-pointer" onClick={() => router.push("/caretaker/payment")}>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl"><CreditCard className="w-6 h-6 text-green-600" /></div>
              {isPaid ? (<span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>) : (<span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Outstanding</span>)}
            </div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Billing</h3>
            {!isPaid && <p className="text-xs text-gray-400 mt-1 font-semibold">Outstanding Balance</p>}
            <p className="text-4xl font-bold tracking-tight text-gray-900 mt-1">{isPaid ? 'Paid' : '₦7,500'}</p>
            <p className="text-sm text-gray-700 mt-2 font-semibold">{isPaid ? `Next payment: ${building.next_billing_date ? new Date(building.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Aug 1'}` : 'Payment overdue • Due Jul 3'}</p>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500"><span className="font-semibold">Invoices: {invoiceCount.paid} Paid, {invoiceCount.due} Due</span></div>
            <div className="mt-4 flex items-center gap-1 text-sm font-bold text-green-600"><span>{isPaid ? 'View Receipt' : 'View Invoice'}</span><ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" /></div>
            <button onClick={(e) => { e.stopPropagation(); setShowAutopay(true); }} className="mt-4 w-full py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition-all border border-gray-200">⚡ Set Autopay</button>
          </div>

          {/* 2. WALLET BALANCE CARD */}
          <div className="group relative bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg p-6 text-white transition-all duration-300 hover:-translate-y-[3px] hover:shadow-xl">
            <div className="flex items-start justify-between mb-4"><div className="bg-white/20 p-3 rounded-xl"><Wallet className="w-6 h-6 text-white" /></div></div>
            <h3 className="text-sm font-bold text-green-100 uppercase tracking-wide">Wallet Balance</h3>
            <p className="text-4xl font-bold tracking-tight text-white mt-1">₦{walletBalance.toLocaleString()}</p>
            <button onClick={handleAddFundsClick} className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all"><Plus size={18} /> Add Funds</button>
          </div>

          {/* 3. COLLECTION STATUS CARD */}
          <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer" onClick={() => router.push("/caretaker/collection")}>
            <div className="flex items-start justify-between mb-6">
              <div className="bg-green-50 p-3.5 rounded-2xl"><Truck className="w-14 h-14 text-green-600" /></div>
              <span className={`${statusInfo.badgeColor} text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-200`}>{statusInfo.icon} {statusInfo.status}</span>
            </div>
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Next Pickup</p>
              <h3 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">{schedule?.next_pickup_date ? new Date(schedule.next_pickup_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No Date Set'}</h3>
              <p className="text-lg font-bold text-gray-700 mb-3">{schedule?.time_window || 'Time TBD'}</p>
              <p className="text-sm font-bold text-gray-500">{schedule?.frequency || 'Weekly'} • {schedule?.waste_type || 'General'}</p>
            </div>
          </div>
        </div>

        {/* 4. BUILDING DETAILS CARD */}
        <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer mb-10" onClick={() => router.push("/caretaker/building")}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3"><div className="bg-green-50 p-3 rounded-2xl"><Building2 className="w-8 h-8 text-green-600" /></div><h3 className="text-lg font-bold text-gray-900 uppercase">BUILDING ID</h3></div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">{building.custom_id}</h2>
          <p className="text-lg font-medium text-gray-700 mb-6">{building.building_type}</p>
          <div className="border-t border-gray-100 my-6"></div>
          <div className="space-y-3 mb-6"><div className="flex items-center gap-3 text-sm text-gray-600"><MapPin className="w-4 h-4 text-gray-400" /><span className="font-bold">{building.address || 'Address not provided'}</span></div></div>
          <div className="flex items-center gap-1 text-green-600 font-semibold text-sm"><span>View Building</span><ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></div>
        </div>

        {/* 5. COLLECTION HISTORY SUMMARY CARD */}
        <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-500 cursor-pointer mb-10" onClick={() => router.push("/caretaker/collection-history")}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3"><div className="bg-green-50 p-3 rounded-2xl"><Calendar className="w-8 h-8 text-green-600" /></div><h3 className="text-lg font-bold text-gray-900 uppercase">COLLECTION HISTORY</h3></div>
            <span className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 border border-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Up to Date</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">Last Collection</p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">{collectionHistory.length > 0 ? new Date(collectionHistory[0].collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'No Collections Yet'}</h2>
          <p className="text-base font-medium text-green-600 flex items-center gap-2 mb-6"><CheckCircle2 className="w-5 h-5" /> {collectionHistory.length > 0 ? 'Completed Successfully' : 'Awaiting First Pickup'}</p>
          <div className="border-t border-gray-100 my-6"></div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-bold text-gray-500 uppercase">This Month</p><p className="text-lg font-bold text-gray-900">{collectionHistory.length} Collections Completed</p></div>
            <div className="flex items-center gap-1 text-green-600 font-semibold text-sm"><span>View History</span><ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" /></div>
          </div>
        </div>

        <div className="bg-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div><h3 className="text-lg font-bold mb-1">Need Help?</h3><p className="text-sm text-green-100 font-semibold">Contact your waste collection hauler</p></div>
            <button className="flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all"><Phone size={18} /> Call Hauler</button>
          </div>
        </div>
      </main>

      {/* Modals (Add Funds & Autopay) */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-gray-900">Add Funds to Wallet</h3><button onClick={() => setShowAddFunds(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-600" /></button></div>
            <p className="text-sm font-bold text-gray-700 mb-4">Select a payment method:</p>
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button key={method.id} onClick={() => setSelectedMethod(method.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="p-2 bg-gray-100 rounded-lg">{method.type === 'card' ? <CreditCard className="w-5 h-5 text-gray-700" /> : <Landmark className="w-5 h-5 text-gray-700" />}</div>
                  <div className="text-left"><p className="text-sm font-bold text-gray-900">{method.type === 'card' ? `${method.card_brand?.toUpperCase()} •••• ${method.card_last_four}` : `${method.bank_name} •••• ${method.account_number}`}</p><p className="text-xs text-gray-700 font-semibold">{method.type === 'card' ? 'Credit/Debit Card' : 'Bank Account'}</p></div>
                  {selectedMethod === method.id && <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3"><button onClick={() => setShowAddFunds(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button><button onClick={handleConfirmAddFunds} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">Continue</button></div>
          </div>
        </div>
      )}

      {showAutopay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-gray-900">Set Autopay</h3><button onClick={() => setShowAutopay(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-600" /></button></div>
            <p className="text-sm font-bold text-gray-700 mb-4">Choose how you want to pay your bills automatically on the 1st of every month:</p>
            <div className="space-y-3 mb-6">
              <button onClick={() => setAutopaySource('wallet')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'wallet' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="p-2 bg-gray-100 rounded-lg"><Wallet className="w-5 h-5 text-gray-700" /></div>
                <div className="text-left flex-1"><p className="text-sm font-bold text-gray-900">Trakbin Wallet</p><p className="text-xs text-gray-700 font-semibold">Balance: ₦{walletBalance.toLocaleString()}</p></div>
                {autopaySource === 'wallet' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </button>
              <button onClick={() => setAutopaySource('card')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'card' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="p-2 bg-gray-100 rounded-lg"><CreditCard className="w-5 h-5 text-gray-700" /></div>
                <div className="text-left flex-1"><p className="text-sm font-bold text-gray-900">Saved Card / Bank</p><p className="text-xs text-gray-700 font-semibold">Auto-charge when due</p></div>
                {autopaySource === 'card' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6"><p className="text-xs font-bold text-blue-800">ℹ️ How it works:</p><p className="text-xs text-blue-700 mt-1">On the 1st of every month, we will automatically deduct ₦7,500 from your selected source.</p></div>
            <div className="flex gap-3"><button onClick={() => setShowAutopay(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button><button onClick={handleSaveAutopay} disabled={autopayLoading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400">{autopayLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enable Autopay'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}