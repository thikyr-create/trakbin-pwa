"use client";
import { X, CircleCheck, CreditCard, Landmark } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { useState } from 'react';

export default function AddFundsModal() {
  const { showAddFunds, setShowAddFunds, paymentMethods, selectedMethod, setSelectedMethod, addFunds } = useCaretakerSession();
  const [amount, setAmount] = useState('');

  if (!showAddFunds) return null;

  const handleConfirm = async () => {
    if (!selectedMethod) { alert('Please select a payment method'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { alert('Please enter a valid amount'); return; }
    
    await addFunds(Number(amount), selectedMethod);
    setAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Add Funds to Wallet</h3>
          <button onClick={() => setShowAddFunds(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={20} className="text-gray-600" /></button>
        </div>
        
        <p className="text-sm font-bold text-gray-700 mb-4">Select a payment method:</p>
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <button 
              key={method.id} 
              onClick={() => setSelectedMethod(method.id)} 
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                {method.type === 'card' ? <CreditCard className="w-5 h-5 text-gray-700" /> : <Landmark className="w-5 h-5 text-gray-700" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">
                  {method.type === 'card' ? `${method.card_brand?.toUpperCase()} •••• ${method.card_last_four}` : `${method.bank_name} •••• ${method.account_number}`}
                </p>
                <p className="text-xs text-gray-700 font-semibold">{method.type === 'card' ? 'Credit/Debit Card' : 'Bank Account'}</p>
              </div>
              {selectedMethod === method.id && <CircleCheck className="w-5 h-5 text-green-600 ml-auto" />}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount (₦)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="Enter amount"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowAddFunds(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleConfirm} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">Continue</button>
        </div>
      </div>
    </div>
  );
}