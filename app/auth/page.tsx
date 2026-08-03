"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import BuildingIdCard from './components/BuildingIdCard';
import type { AccountType } from '@/lib/auth/types';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>('Caretaker');
  const [showIdCard, setShowIdCard] = useState(false);
  const [generated, setGenerated] = useState<{ id: string; passcode: string; address: string }>({ id: '', passcode: '', address: '' });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#login') setIsLogin(true);
  }, []);

  const handleIdCardClose = () => {
    setShowIdCard(false);
    setIsLogin(true);
    setGenerated({ id: '', passcode: '', address: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
        <div className="px-8 pt-6">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition-all">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        <div className="p-8 pb-4 text-center border-b border-green-50">
          <h1 className="text-3xl font-bold text-green-600 tracking-tight">Join Trakbin™</h1>
        </div>

        <div className="px-8 pb-8">
          <div className="flex bg-green-50 p-1 rounded-xl mb-6">
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Register</button>
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Login</button>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{isLogin ? 'Login As' : 'Register As'}</label>
            <div className="relative">
              <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium appearance-none focus:ring-2 focus:ring-green-500 outline-none">
                <option value="Caretaker">Caretaker / Building Manager</option>
                <option value="Operations">Waste Company / Driver</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {isLogin ? (
            <LoginForm accountType={accountType} />
          ) : (
            <RegisterForm
              accountType={accountType}
              onRegistered={(id, passcode, address) => { setGenerated({ id, passcode, address }); setShowIdCard(true); }}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>

      {showIdCard && (
        <BuildingIdCard
          buildingId={generated.id}
          passcode={generated.passcode}
          address={generated.address}
          onClose={handleIdCardClose}
        />
      )}
    </div>
  );
}