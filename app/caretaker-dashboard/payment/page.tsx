"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, CreditCard, Download, CheckCircle2, Clock, AlertCircle, LogOut, Plus, Wallet, Loader2, Landmark, X, Receipt } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PaymentPage() {
  const router = useRouter();
  const [buildingId, setBuildingId] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'wallet' | 'methods'>('invoices');
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showAutopay, setShowAutopay] = useState(false);
  const [autopayLoading, setAutopayLoading] = useState(false);
  const [autopaySource, setAutopaySource] = useState<'wallet' | 'card'>('wallet');
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [methodType, setMethodType] = useState<'card' | 'bank'>('card');

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    const storedCaretaker = localStorage.getItem('trakbin_caretaker');
    if (storedCaretaker) {
      const data = JSON.parse(storedCaretaker);
      setBuildingId(data.custom_id);
      fetchAllData(data.custom_id);
    } else { router.push('/auth'); }
  }, [router]);

  const fetchAllData = async (bId: string) => {
    const { data: invoicesData } = await supabase.from('invoices').select('*').eq('building_id', bId).order('due_date', { ascending: false });
    const { data: methodsData } = await supabase.from('payment_methods').select('*').eq('building_id', bId);
    const { data: transactionsData } = await supabase.from('wallet_transactions').select('*').eq('building_id', bId).order('created_at', { ascending: false }).limit(10);
    const { data: buildingData } = await supabase.from('Buildings').select('wallet_balance, autopay_enabled, autopay_source').eq('custom_id', bId).single();

    if (invoicesData) setInvoices(invoicesData);
    if (methodsData) setPaymentMethods(methodsData);
    if (transactionsData) setWalletTransactions(transactionsData);
    if (buildingData) {
      setWalletBalance(buildingData.wallet_balance || 0);
      setAutopayEnabled(buildingData.autopay_enabled || false);
      if (buildingData.autopay_source) setAutopaySource(buildingData.autopay_source);
    }
    setLoading(false);
  };

  const handlePayNow = async () => { setProcessing(true); setTimeout(() => { alert("Payment Gateway Integration (Paystack/Stripe) will open here!"); setProcessing(false); }, 1500); };
  const handleAddToWallet = async () => {
    const amount = prompt("Enter amount to deposit ():");
    if (!amount || isNaN(Number(amount))) return;
    setProcessing(true);
    setTimeout(async () => {
      const numAmount = Number(amount);
      await supabase.from('wallet_transactions').insert([{ building_id: buildingId, type: 'deposit', amount: numAmount, description: 'Wallet top-up', status: 'completed' }]);
      const newBalance = walletBalance + numAmount;
      await supabase.from('Buildings').update({ wallet_balance: newBalance }).eq('custom_id', buildingId);
      setWalletBalance(newBalance); fetchAllData(buildingId); setProcessing(false);
      alert(`₦${numAmount.toLocaleString()} added to wallet!`);
    }, 1500);
  };

  const handleAddPaymentMethod = async () => {
    setProcessing(true);
    const methodData: any = { building_id: buildingId, type: methodType, is_default: paymentMethods.length === 0 };
    if (methodType === 'card') { methodData.card_last_four = cardNumber.slice(-4); methodData.card_brand = cardNumber.startsWith('4') ? 'visa' : cardNumber.startsWith('5') ? 'mastercard' : 'unknown'; } 
    else { methodData.bank_name = bankName; methodData.account_number = accountNumber.slice(-4); methodData.account_name = accountName; }
    const { error } = await supabase.from('payment_methods').insert([methodData]);
    if (error) { alert('Error adding payment method: ' + error.message); } 
    else { alert('Payment method added successfully!'); setShowAddMethod(false); setCardNumber(''); setCardExpiry(''); setCardCvv(''); setBankName(''); setAccountNumber(''); setAccountName(''); fetchAllData(buildingId); }
    setProcessing(false);
  };

  const handleSaveAutopay = async () => {
    setAutopayLoading(true);
    await supabase.from('Buildings').update({ autopay_enabled: true, autopay_source: autopaySource }).eq('custom_id', buildingId);
    setAutopayLoading(false); setShowAutopay(false); setAutopayEnabled(true);
    alert(`✅ Autopay enabled! We will automatically deduct from your ${autopaySource} on the 1st of every month.`);
  };

  const handleDisableAutopay = async () => {
    if (confirm('Are you sure you want to disable Autopay?')) {
      await supabase.from('Buildings').update({ autopay_enabled: false }).eq('custom_id', buildingId);
      setAutopayEnabled(false); alert('Autopay disabled.');
    }
  };

  const totalOutstanding = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const isOverdue = invoices.some(inv => inv.status === 'overdue');
  const nextDueDate = invoices.find(inv => inv.status !== 'paid')?.due_date || 'None';

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 text-green-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/caretaker-dashboard')} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"><ArrowLeft size={20} /></button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xl">T</span></div><span className="text-xl font-bold text-gray-900 tracking-tight">Trakbin</span></div>
            </div>
            <button onClick={() => router.push('/')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* FLOATING HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent opacity-50"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-xl shadow-lg shadow-green-200"><Receipt className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing & Payments</h1>
              <p className="text-sm text-gray-500 font-medium">Manage your invoices and wallet for Building {buildingId}</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-green-600" /><h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Outstanding Balance</h2></div>
              <div className="flex items-baseline gap-2 mb-2"><span className="text-5xl font-bold tracking-tight text-gray-900">₦{totalOutstanding.toLocaleString()}</span></div>
              <div className="flex items-center gap-2 mb-8">
                {isOverdue ? (<span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Payment Overdue</span>) : (<span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> All Caught Up</span>)}
                <span className="text-sm text-gray-700 font-medium">Next due: {new Date(nextDueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <button onClick={handlePayNow} disabled={processing || totalOutstanding === 0} className="w-full md:flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all transform hover:-translate-y-0.5 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed">{processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Now'}</button>
                <button onClick={() => setShowAutopay(true)} className="w-full md:w-auto px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all">{autopayEnabled ? '⚡ Autopay Enabled' : 'Set Autopay'}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mb-6 border-b border-gray-300">
          <button onClick={() => setActiveTab('invoices')} className={`pb-3 px-2 text-base font-bold transition-all ${activeTab === 'invoices' ? 'text-green-600 border-b-3 border-green-600' : 'text-gray-700 hover:text-green-600'}`}>Invoices</button>
          <button onClick={() => setActiveTab('wallet')} className={`pb-3 px-2 text-base font-bold transition-all ${activeTab === 'wallet' ? 'text-green-600 border-b-3 border-green-600' : 'text-gray-700 hover:text-green-600'}`}>Wallet History</button>
          <button onClick={() => setActiveTab('methods')} className={`pb-3 px-2 text-base font-bold transition-all ${activeTab === 'methods' ? 'text-green-600 border-b-3 border-green-600' : 'text-gray-700 hover:text-green-600'}`}>Payment Methods</button>
        </div>

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Invoice History</h2><span className="text-sm text-gray-700 font-medium">{invoices.length} Total</span></div>
            <div className="divide-y divide-gray-100">
              {invoices.length > 0 ? invoices.map((invoice) => (
                <div key={invoice.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${invoice.status === 'paid' ? 'bg-green-50' : 'bg-red-50'}`}>{invoice.status === 'paid' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-red-600" />}</div>
                    <div><p className="text-sm font-bold text-gray-900">{invoice.description}</p><p className="text-xs text-gray-700 mt-0.5">Due: {new Date(invoice.due_date).toLocaleDateString()}</p></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><p className="text-sm font-bold text-gray-900">₦{invoice.amount.toLocaleString()}</p><p className={`text-xs font-semibold mt-0.5 capitalize ${invoice.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{invoice.status}</p></div>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Download size={18} /></button>
                  </div>
                </div>
              )) : <div className="px-8 py-12 text-center text-gray-700 font-medium">No invoices found.</div>}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Wallet Transactions</h2></div>
            <div className="divide-y divide-gray-100">
              {walletTransactions.length > 0 ? walletTransactions.map((tx) => (
                <div key={tx.id} className="px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-green-50' : tx.type === 'payment' ? 'bg-blue-50' : 'bg-gray-50'}`}>{tx.type === 'deposit' ? <Plus className="w-5 h-5 text-green-600" /> : <Wallet className="w-5 h-5 text-blue-600" />}</div>
                    <div><p className="text-sm font-bold text-gray-900 capitalize">{tx.type} - {tx.description}</p><p className="text-xs text-gray-700 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p></div>
                  </div>
                  <div className="text-right"><p className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>{tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()}</p><p className="text-xs text-gray-700 capitalize font-medium">{tx.status}</p></div>
                </div>
              )) : <div className="px-8 py-12 text-center text-gray-700 font-medium">No wallet transactions yet.</div>}
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Payment Methods</h2><button onClick={() => setShowAddMethod(true)} className="flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-all"><Plus size={16} /> Add New</button></div>
            <div className="divide-y divide-gray-100">
              {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                <div key={method.id} className="px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl">{method.type === 'card' ? <CreditCard className="w-6 h-6 text-gray-700" /> : <Landmark className="w-6 h-6 text-gray-700" />}</div>
                    <div><p className="text-sm font-bold text-gray-900">{method.type === 'card' ? `${method.card_brand?.toUpperCase()} •••• ${method.card_last_four}` : `${method.bank_name} •••• ${method.account_number}`}</p><p className="text-xs text-gray-700 mt-0.5">{method.type === 'card' ? 'Credit/Debit Card' : `Account: ${method.account_name}`}</p></div>
                  </div>
                </div>
              )) : <div className="px-8 py-12 text-center text-gray-700 font-medium">No payment methods added yet. Click "Add New" to get started.</div>}
            </div>
          </div>
        )}
      </main>

      {/* Add Payment Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-gray-900">Add Payment Method</h3><button onClick={() => setShowAddMethod(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-600" /></button></div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setMethodType('card')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${methodType === 'card' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><CreditCard size={18} /> Card</button>
              <button onClick={() => setMethodType('bank')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${methodType === 'bank' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Landmark size={18} /> Bank</button>
            </div>
            {methodType === 'card' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label><input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label><input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">CVV</label><input type="text" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" /></div>
                </div>
              </div>
            )}
            {methodType === 'bank' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label><input type="text" placeholder="First Bank of Nigeria" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><input type="text" placeholder="0123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label><input type="text" placeholder="John Doe" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" /></div>
              </div>
            )}
            <div className="flex gap-3 mt-6"><button onClick={() => setShowAddMethod(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all">Cancel</button><button onClick={handleAddPaymentMethod} disabled={processing} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all disabled:bg-gray-300">{processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Add Method'}</button></div>
          </div>
        </div>
      )}

      {/* Autopay Modal */}
      {showAutopay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-gray-900">{autopayEnabled ? 'Manage Autopay' : 'Set Autopay'}</h3><button onClick={() => setShowAutopay(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-600" /></button></div>
            {autopayEnabled ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><p className="text-sm font-bold text-green-800">Autopay is Active</p></div><p className="text-xs text-green-700">We automatically deduct ₦7,500 from your <strong>{autopaySource}</strong> on the 1st of every month.</p></div>
                <div className="space-y-3 mb-6">
                  <button onClick={() => setAutopaySource('wallet')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'wallet' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="p-2 bg-gray-100 rounded-lg"><Wallet className="w-5 h-5 text-gray-700" /></div><div className="text-left flex-1"><p className="text-sm font-bold text-gray-900">Trakbin Wallet</p><p className="text-xs text-gray-700 font-semibold">Balance: ₦{walletBalance.toLocaleString()}</p></div>{autopaySource === 'wallet' && <CheckCircle2 className="w-5 h-5 text-green-600" />}</button>
                  <button onClick={() => setAutopaySource('card')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'card' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="p-2 bg-gray-100 rounded-lg"><CreditCard className="w-5 h-5 text-gray-700" /></div><div className="text-left flex-1"><p className="text-sm font-bold text-gray-900">Saved Card / Bank</p><p className="text-xs text-gray-700 font-semibold">Auto-charge when due</p></div>{autopaySource === 'card' && <CheckCircle2 className="w-5 h-5 text-green-600" />}</button>
                </div>
                <div className="flex gap-3"><button onClick={handleDisableAutopay} className="flex-1 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-all">Disable Autopay</button><button onClick={handleSaveAutopay} disabled={autopayLoading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400">{autopayLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Source'}</button></div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-700 mb-4">Choose how you want to pay your bills automatically on the 1st of every month:</p>
                <div className="space-y-3 mb-6">
                  <button onClick={() => setAutopaySource('wallet')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'wallet' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="p-2 bg-gray-100 rounded-lg"><Wallet className="w-5 h-5 text-gray-700" /></div><div className="text-left flex-1"><p className="text-sm font-bold text-gray-900">Trakbin Wallet</p><p className="text-xs text-gray-700 font-semibold">Balance: ₦{walletBalance.toLocaleString()}</p></div>{autopaySource === 'wallet' && <CheckCircle2 className="w-5 h-5 text-green-600" />}</button>
                  <button onClick={() => setAutopaySource('card')} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'card' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="p-2 bg-gray-100 rounded-lg"><CreditCard className="w-5 h-5 text-gray-700" /></div><div className="text-left flex-1"><p className="text-sm font-bold text-gray-900">Saved Card / Bank</p><p className="text-xs text-gray-700 font-semibold">Auto-charge when due</p></div>{autopaySource === 'card' && <CheckCircle2 className="w-5 h-5 text-green-600" />}</button>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6"><p className="text-xs font-bold text-blue-800">ℹ️ How it works:</p><p className="text-xs text-blue-700 mt-1">On the 1st of every month, we will automatically deduct ₦7,500 from your selected source.</p></div>
                <div className="flex gap-3"><button onClick={() => setShowAutopay(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button><button onClick={handleSaveAutopay} disabled={autopayLoading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400">{autopayLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enable Autopay'}</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}