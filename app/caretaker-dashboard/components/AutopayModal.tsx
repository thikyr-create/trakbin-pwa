"use client";
import { X, CircleCheck, Wallet, CreditCard, Loader2 } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export default function AutopayModal() {
  const { showAutopay, setShowAutopay, autopaySource, setAutopaySource, walletBalance, autopayLoading, saveAutopay } = useCaretakerSession();

  if (!showAutopay) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Set Autopay</h3>
          <button onClick={() => setShowAutopay(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-600" /></button>
        </div>
        
        <p className="text-sm font-bold text-gray-700 mb-4">Choose how you want to pay your bills automatically on the 1st of every month:</p>
        <div className="space-y-3 mb-6">
          <button 
            onClick={() => setAutopaySource('wallet')} 
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'wallet' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="p-2 bg-gray-100 rounded-lg"><Wallet className="w-5 h-5 text-gray-700" /></div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-gray-900">Trakbin Wallet</p>
              <p className="text-xs text-gray-700 font-semibold">Balance: ₦{walletBalance.toLocaleString()}</p>
            </div>
            {autopaySource === 'wallet' && <CircleCheck className="w-5 h-5 text-green-600" />}
          </button>
          
          <button 
            onClick={() => setAutopaySource('card')} 
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${autopaySource === 'card' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="p-2 bg-gray-100 rounded-lg"><CreditCard className="w-5 h-5 text-gray-700" /></div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-gray-900">Saved Card / Bank</p>
              <p className="text-xs text-gray-700 font-semibold">Auto-charge when due</p>
            </div>
            {autopaySource === 'card' && <CircleCheck className="w-5 h-5 text-green-600" />}
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-blue-800">ℹ️ How it works:</p>
          <p className="text-xs text-blue-700 mt-1">On the 1st of every month, we will automatically deduct ₦7,500 from your selected source.</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setShowAutopay(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
          <button 
            onClick={saveAutopay} 
            disabled={autopayLoading} 
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {autopayLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enable Autopay'}
          </button>
        </div>
      </div>
    </div>
  );
}