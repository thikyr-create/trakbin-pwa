"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { JetBrains_Mono } from 'next/font/google';
import { Building2, LogIn, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { authEngine } from '@/lib/auth/authEngine';
import { supabaseAuth } from '@/lib/auth/supabaseAuth';
import { ROLE_HOME } from '@/lib/auth/permissions';
import type { AccountType } from '@/lib/auth/types';
import OTPInput from './OTPInput';
import BuildingIdCard from './BuildingIdCard';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200';

type View = 'login' | 'forgot' | 'reset' | 'caretaker-recover';

export default function LoginForm({ accountType }: { accountType: AccountType }) {
  const router = useRouter();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recAddress, setRecAddress] = useState('');
  const [recovered, setRecovered] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('');
    const res = await authEngine.login({ accountType, buildingId, passcode, email, password });
    setMessage(res.message);
    if (res.ok && res.role) router.push(ROLE_HOME[res.role]);
    setLoading(false);
  };

  const sendOtp = async () => {
    if (!email.trim()) { setMessage('❌ Enter your account email first.'); return; }
    setLoading(true); setMessage('');
    const { error } = await supabaseAuth.requestOtp(email.trim());
    setLoading(false);
    if (error) { setMessage('❌ ' + error.message); return; }
    setMessage('✅ Code sent to ' + email.trim()); setView('reset');
  };

  const doReset = async () => {
    if (otp.length < 6 || !newPassword) { setMessage('❌ Enter the 6-digit code and a new password.'); return; }
    setLoading(true); setMessage('');
    const v = await supabaseAuth.verifyOtp(email.trim(), otp);
    if (v.error) { setLoading(false); setMessage('❌ ' + v.error.message); return; }
    const u = await supabaseAuth.updatePassword(newPassword);
    setLoading(false);
    if (u.error) { setMessage('❌ ' + u.error.message); return; }
    setMessage('✅ Password updated. Sign in with your new password.');
    setOtp(''); setNewPassword(''); setView('login');
  };

  const doCaretakerRecover = async () => {
    if (!buildingId.trim() || !recAddress.trim() || !newPassword) { setMessage('❌ Enter Building ID, the official address, and a new passcode.'); return; }
    setLoading(true); setMessage('');
    const res = await authEngine.resetCaretakerPasscode(buildingId, recAddress, newPassword);
    setLoading(false);
    setMessage(res.message);
    if (res.ok && res.building) setRecovered(res.building);
  };

  return (
    <motion.form key={accountType + view} onSubmit={(e) => { e.preventDefault(); if (view === 'login') submit(e); else if (view === 'forgot') sendOtp(); else if (view === 'reset') doReset(); else doCaretakerRecover(); }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="space-y-4">
      {view === 'login' && (
        <>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900"><LogIn className="h-5 w-5 text-emerald-600" /> {accountType === 'Caretaker' ? 'Caretaker Login' : 'Operations Login'}</h2>
          {accountType === 'Caretaker' ? (
            <>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Building ID (e.g., TRK-ABC123)" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className={`${inputCls} pl-10`} />
              </div>
              <input type="password" placeholder="Passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required className={inputCls} />
              <button type="button" onClick={() => { setView('caretaker-recover'); setMessage(''); }} className="text-xs font-bold text-emerald-600 underline hover:text-emerald-800">Forgot passcode?</button>
            </>
          ) : (
            <>
              <input type="text" placeholder="Email or Employee ID" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
              <button type="button" onClick={() => { setView('forgot'); setMessage(''); }} className="text-xs font-bold text-emerald-600 underline hover:text-emerald-800">Forgot password?</button>
            </>
          )}
          <motion.button whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }} type="submit" disabled={loading} className={`w-full rounded-xl py-3 font-extrabold text-white shadow-lg transition-all ${loading ? 'cursor-not-allowed bg-gray-400 shadow-none' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}>
            {loading ? 'Signing In...' : 'Sign In'}
          </motion.button>
        </>
      )}

      {view === 'caretaker-recover' && (
        <>
          <button type="button" onClick={() => setView('login')} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600"><ArrowLeft size={14} /> Back to login</button>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900"><KeyRound className="h-5 w-5 text-emerald-600" /> Reset caretaker passcode</h2>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Building ID" value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required className={`${inputCls} pl-10`} />
          </div>
          <input type="text" placeholder="Official building address (as registered)" value={recAddress} onChange={(e) => setRecAddress(e.target.value)} required className={inputCls} />
          <input type="password" placeholder="New passcode" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputCls} />
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-400">
            {loading ? 'Updating…' : 'Set new passcode'}
          </motion.button>
        </>
      )}

      {view === 'forgot' && (
        <>
          <button type="button" onClick={() => setView('login')} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600"><ArrowLeft size={14} /> Back to login</button>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900"><KeyRound className="h-5 w-5 text-emerald-600" /> Reset password</h2>
          <input type="email" placeholder="Account email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-400">
            {loading ? 'Sending…' : 'Email me a code'}
          </motion.button>
        </>
      )}

      {view === 'reset' && (
        <>
          <button type="button" onClick={() => setView('forgot')} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600"><ArrowLeft size={14} /> Back</button>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900"><KeyRound className="h-5 w-5 text-emerald-600" /> Enter code + new password</h2>
          <OTPInput value={otp} onChange={setOtp} />
          <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputCls} />
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 py-3 font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:bg-gray-400">
            {loading ? 'Updating…' : 'Set new password'}
          </motion.button>
        </>
      )}

      {message && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 rounded-xl p-4 text-sm font-medium ${message.includes('❌') ? 'border border-red-100 bg-red-50 text-red-700' : 'border border-green-200 bg-green-50 text-green-700'}`}>
          {message.includes('❌') ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <p>{message}</p>
        </motion.div>
      )}

      {recovered && (
        <BuildingIdCard buildingId={recovered.custom_id} passcode={recovered.passcode} address={recovered.address} onClose={() => { setRecovered(null); setView('login'); }} />
      )}
    </motion.form>
  );
}