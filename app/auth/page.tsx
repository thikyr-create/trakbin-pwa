"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ArrowLeft, ChevronDown, Building2, Truck, Users } from 'lucide-react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import BuildingIdCard from './components/BuildingIdCard';
import type { AccountType } from '@/lib/auth/types';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ROLES = [
  { Icon: Building2, label: 'Caretaker', sub: 'report & pay' },
  { Icon: Truck, label: 'Company', sub: 'collect & earn' },
  { Icon: Users, label: 'Driver', sub: 'run the route' },
];

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<AccountType>('Caretaker');
  const [showIdCard, setShowIdCard] = useState(false);
  const [generated, setGenerated] = useState<{ id: string; passcode: string; address: string }>({ id: '', passcode: '', address: '' });

   useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#login') setIsLogin(true);
      if (window.location.hash === '#register') setIsLogin(false);
    }
  }, []);

  const handleIdCardClose = () => { setShowIdCard(false); setIsLogin(true); setGenerated({ id: '', passcode: '', address: '' }); };

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* brand console */}
        <motion.aside initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }} className="relative hidden overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

          <div className="relative z-10">
            <button onClick={() => router.push('/')} className="mb-10 flex items-center gap-2 text-sm font-semibold text-emerald-100/70 transition-colors hover:text-white"><ArrowLeft size={16} /> Back to Home</button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-900/40"><span className={`${display.className} text-xl font-black text-emerald-950`}>T</span></div>
              <div className="leading-none">
                <p className={`${display.className} text-xl font-black tracking-tight`}>Trakbin</p>
                <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>waste, routed</p>
              </div>
            </div>
            <h1 className={`${display.className} mt-8 max-w-md text-4xl font-extrabold leading-[1.05] tracking-tight`}>One ledger for the whole street.</h1>
            <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-emerald-100/70">Caretakers report and pay, companies collect and earn, drivers run the route — every naira balanced and visible.</p>
          </div>

          {/* animated collection route */}
          <div className="relative z-10">
            <svg viewBox="0 0 400 220" className="w-full">
              <path id="route" d="M16,200 C 90,150 60,90 150,84 S 280,40 388,24" fill="none" stroke="rgba(110,231,183,0.35)" strokeWidth="2" strokeDasharray="6 6" />
              {[{ x: 16, y: 200 }, { x: 150, y: 84 }, { x: 388, y: 24 }].map((p, i) => (
                <g key={i}>
                  <motion.circle cx={p.x} cy={p.y} r="5" fill="#34d399" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.2, type: 'spring', stiffness: 260, damping: 16 }} />
                  <motion.circle cx={p.x} cy={p.y} r="5" fill="none" stroke="rgba(52,211,153,0.5)" initial={{ r: 5, opacity: 0.6 }} animate={{ r: 16, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }} />
                </g>
              ))}
              <circle r="5" fill="#a7f3d0">
                <animateMotion dur="7s" repeatCount="indefinite"><mpath href="#route" /></animateMotion>
              </circle>
            </svg>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {ROLES.map((r, i) => (
                <motion.div key={r.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1, ease: EASE }} className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
                  <r.Icon className="h-4 w-4 text-emerald-300" />
                  <p className="mt-1.5 text-xs font-extrabold">{r.label}</p>
                  <p className="text-[10px] font-semibold text-emerald-100/60">{r.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* form column */}
        <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
          <button onClick={() => router.push('/')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-emerald-600 lg:hidden"><ArrowLeft size={16} /> Back to Home</button>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="rounded-[26px] border border-gray-200/80 bg-white p-7 shadow-xl shadow-emerald-900/5 sm:p-8">
            <div className="mb-6 lg:hidden">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600"><span className={`${display.className} text-lg font-black text-white`}>T</span></div>
                <p className={`${display.className} text-lg font-black tracking-tight`}>Trakbin</p>
              </div>
            </div>

            {/* sliding segmented control */}
            <div className="relative mb-6 grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
              {(['register', 'login'] as const).map((m) => {
                const active = (m === 'login') === isLogin;
                return (
                  <button key={m} onClick={() => setIsLogin(m === 'login')} className="relative z-10 rounded-xl py-2.5 text-sm font-extrabold capitalize transition-colors">
                    {active && <motion.span layoutId="authtab" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                    <span className={`relative z-10 ${active ? 'text-emerald-700' : 'text-gray-500'}`}>{m}</span>
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}>{isLogin ? 'Login as' : 'Register as'}</label>
              <div className="relative">
                <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)} className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200">
                  <option value="Caretaker">Caretaker / Building Manager</option>
                  <option value="Operations">Waste Company / Driver</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {isLogin
  ? <LoginForm accountType={accountType} onSwitchAccountType={setAccountType} />
  : <RegisterForm accountType={accountType} onRegistered={(id, passcode, address) => { setGenerated({ id, passcode, address }); setShowIdCard(true); }} onSwitchToLogin={() => setIsLogin(true)} />}
          </motion.div>
        </div>
      </div>

      {showIdCard && (
        <BuildingIdCard buildingId={generated.id} passcode={generated.passcode} address={generated.address} onClose={handleIdCardClose} />
      )}
    </div>
  );
}