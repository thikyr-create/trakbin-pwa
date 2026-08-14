// app/admin/login/page.tsx
"use client";

import { useEffect, useState } from 'react';
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
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      setAdminExists((count || 0) > 0);
      setChecking(false);
    })();
  }, []);

  const readRole = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
    return data?.role ?? null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!adminExists) {
        // BOOTSTRAP: metadata flows to on_auth_user_created trigger → profile created with role=admin
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { role: 'admin' } },
        });
        if (error) { setError(error.message); return; }
        if (data.session && data.user) {
          const role = await readRole(data.user.id);
          if (role === 'admin') { router.replace('/admin'); return; }
          setError('Account created. Confirm your email, then sign in here to enter.');
          return;
        }
        setError('Account created. Confirm your email, then sign in here to enter.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); return; }
      const role = await readRole(data.user!.id);
      if (role !== 'admin') {
        await supabase.auth.signOut();
        setError('This account is not an admin.');
        return;
      }
      router.replace('/admin');
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className={`${body.className} flex min-h-screen items-center justify-center bg-[#0c1411]`}>
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

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
          {adminExists ? 'Admin sign in' : 'Create the first admin'}
        </h1>
        <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          {adminExists ? 'Platform control plane' : 'Self-closing bootstrap · disappears once an admin exists'}
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

          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 text-sm font-extrabold text-emerald-950 shadow-lg shadow-emerald-400/25 transition-colors hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : adminExists ? <KeyRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {busy ? 'Working…' : adminExists ? 'Sign in' : 'Create admin'}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-[11px] font-semibold text-emerald-100/40">
          {adminExists
            ? 'Access is limited to accounts with the admin role.'
            : 'No admin exists yet. This form creates the first one — then it locks itself.'}
        </p>
      </motion.div>
    </div>
  );
}