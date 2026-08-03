"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { authEngine } from '@/lib/auth/authEngine';
import { ROLE_HOME } from '@/lib/auth/permissions';
import type { AccountType } from '@/lib/auth/types';

export default function LoginForm({ accountType }: { accountType: AccountType }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('');
    const res = await authEngine.login({ accountType, buildingId, passcode, email, password });
    setMessage(res.message);
    if (res.ok && res.role) router.push(ROLE_HOME[res.role]);
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <LogIn className="w-6 h-6 text-green-600" /> {accountType === 'Caretaker' ? 'Caretaker Login' : 'Operations Login'}
      </h2>

      {accountType === 'Caretaker' ? (
        <>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Building ID (e.g., TRK-ABC123)" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
          <input type="password" placeholder="Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
        </>
      ) : (
        <>
          <input type="text" placeholder="Email or Employee ID" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
        </>
      )}

      <button type="submit" disabled={loading} className={`w-full py-3 font-bold rounded-xl transition-all shadow-lg text-white ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      {message && (
        <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${message.includes('❌') ? 'text-red-700 bg-red-50 border border-red-100' : 'text-green-700 bg-green-50 border border-green-200'}`}>
          {message.includes('❌') ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
          <p>{message}</p>
        </div>
      )}
    </form>
  );
}