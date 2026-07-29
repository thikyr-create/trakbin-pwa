"use client";
import { Wallet, Plus } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export default function WalletCard() {
  const { walletBalance, paymentMethods, setShowAddFunds } = useCaretakerSession();

  const handleAddFundsClick = () => { 
    if (paymentMethods.length === 0) { 
      alert('Please add a payment method first.'); 
    } else { 
      setShowAddFunds(true); 
    } 
  };

  return (
    <div className="group relative bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg p-6 text-white transition-all duration-300 hover:-translate-y-[3px] hover:shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white/20 p-3 rounded-xl"><Wallet className="w-6 h-6 text-white" /></div>
      </div>
      <h3 className="text-sm font-bold text-green-100 uppercase tracking-wide">Wallet Balance</h3>
      <p className="text-4xl font-bold tracking-tight text-white mt-1">₦{walletBalance.toLocaleString()}</p>
      <button 
        onClick={handleAddFundsClick} 
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all"
      >
        <Plus size={18} /> Add Funds
      </button>
    </div>
  );
}