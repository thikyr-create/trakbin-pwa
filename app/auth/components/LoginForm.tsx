"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { JetBrains_Mono } from 'next/font/google';
import { Building2, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { authEngine } from '@/lib/auth/authEngine';
import { ROLE_HOME } from '@/lib/auth/permissions';
import type { AccountType } from '@/lib/auth/types';

const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200';

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
    <motion.form key={accountType} onSubmit={submit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900"><LogIn className="h-5 w-5 text-emerald-600" /> {accountType === 'Caretaker' ? 'Caretaker Login' : 'Operations Login'}</h2>

      {accountType === 'Caretaker' ? (
        <>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Building ID (e.g., TRK-ABC123)" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className={`${inputCls} pl-10`} />
          </div>
          <input type="password" placeholder="Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className={inputCls} />
        </>
      ) : (
        <>
          <input type="text" placeholder="Email or Employee ID" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
        </>
      )}

      <motion.button whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }} type="submit" disabled={loading} className={`w-full rounded-xl py-3 font-extrabold text-white shadow-lg transition-all ${loading ? 'cursor-not-allowed bg-gray-400 shadow-none' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}>
        {loading ? 'Signing In...' : 'Sign In'}
      </motion.button>

      {message && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 rounded-xl p-4 text-sm font-medium ${message.includes('❌') ? 'border border-red-100 bg-red-50 text-red-700' : 'border border-green-200 bg-green-50 text-green-700'}`}>
          {message.includes('❌') ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <p>{message}</p>
        </motion.div>
      )}
    </motion.form>
  );
}