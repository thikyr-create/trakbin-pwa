// app/admin/login/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Shield, Loader2, KeyRound, UserPlus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'bootstrap'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'bootstrap') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { role: 'admin' } },
        });
        if (error) { setError(error.message); return; }
        setInfo('Account created. Confirm your email, then switch to sign in.');
        setMode('signin');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user!.id)
        .maybeSingle();

      if (prof?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('This account does not have the admin role yet.');
        return;
      }
      router.replace('/admin');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${body.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c1411] p-6 text-emerald-50`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full bg-emerald-500/10 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
          <Shield className="h-6 w-6 text-emerald-950" />
        </div>
        <h1 className={`${display.className} mt-4 text-2xl font-black tracking-tight text-white`}>
          {mode === 'signin' ? 'Admin sign in' : 'Create the first admin'}
        </h1>
        <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          Platform control plane
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60`}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="admin@trakbin.app" />
          </div>
          <div>
            <label className={`${mono.className} mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60`}>Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="••••••••" />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-rose-400/10 px-4 py-2.5 text-xs font-bold text-rose-200 ring-1 ring-rose-300/30">
              {error}
            </motion.p>
          )}
          {info && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/30">
              {info}
            </motion.p>
          )}

          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-extrabold text-emerald-950 shadow-lg shadow-emerald-400/25 transition-colors hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <KeyRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create admin'}
          </motion.button>
        </form>

        <button type="button"
          onClick={() => { setMode((m) => (m === 'signin' ? 'bootstrap' : 'signin')); setError(''); setInfo(''); }}
          className="mt-5 w-full text-center text-[11px] font-bold text-emerald-300/70 transition-colors hover:text-emerald-200">
          {mode === 'signin' ? 'No admin account yet? Create the first one' : 'Already have an admin? Sign in'}
        </button>
      </motion.div>
    </div>
  );
}