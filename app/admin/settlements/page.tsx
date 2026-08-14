// app/admin/settlements/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Wallet, Landmark, ShieldCheck, Gauge, BadgeCheck, CircleCheck,
  CircleX, TriangleAlert, ArrowRightLeft,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

const STATE_MACHINE = [
  { key: 'requested', Icon: ArrowRightLeft, tone: 'text-amber-300' },
  { key: 'approved', Icon: ShieldCheck, tone: 'text-blue-300' },
  { key: 'processing', Icon: Gauge, tone: 'text-blue-300' },
  { key: 'processor_confirmed', Icon: BadgeCheck, tone: 'text-emerald-300' },
  { key: 'completed', Icon: CircleCheck, tone: 'text-emerald-300' },
];

function statusTone(s: string) {
  if (['completed', 'success', 'processor_confirmed'].includes(s)) return 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30';
  if (['failed', 'rejected'].includes(s)) return 'text-rose-300 bg-rose-400/10 ring-rose-300/30';
  if (['approved', 'processing'].includes(s)) return 'text-blue-300 bg-blue-400/10 ring-blue-300/30';
  return 'text-amber-300 bg-amber-400/10 ring-amber-300/30';
}

export default function AdminSettlementsPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [balances, setBalances] = useState<{ key: string; name: string; earned: number; withdrawn: number; available: number }[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [pRes, ltRes, hRes] = await Promise.all([
        supabase.from('payouts').select('*').order('created_at', { ascending: false }),
        supabase.from('ledger_transactions').select('company_id, net'),
        supabase.from('haulers').select('id, business_name'),
      ]);
      if (!alive) return;
      const pays = pRes.data || [];
      setPayouts(pays);

      // Balances are DERIVED: ledger net − non-rejected payouts. Never stored.
      const earned = new Map<string, number>();
      (ltRes.data || []).forEach((t: any) => {
        const k = String(t.company_id ?? 'unattributed');
        earned.set(k, (earned.get(k) || 0) + (Number(t.net) || 0));
      });
      const withdrawn = new Map<string, number>();
      pays.filter((p: any) => !['rejected', 'failed'].includes(p.status)).forEach((p: any) => {
        const k = String(p.company_id);
        withdrawn.set(k, (withdrawn.get(k) || 0) + (Number(p.amount) || 0));
      });

      const names = new Map((hRes.data || []).map((h: any) => [String(h.id), h.business_name]));
      const keys = new Set([...earned.keys(), ...withdrawn.keys()]);
      setBalances([...keys].map((k) => {
        const e = earned.get(k) || 0;
        const w = withdrawn.get(k) || 0;
        return { key: k, name: names.get(k) || (k === 'unattributed' ? 'Unattributed' : `Operator #${k}`), earned: e, withdrawn: w, available: e - w };
      }).sort((a, b) => b.available - a.available));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
              Settlements · what Trakbin owes operators
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Settlement ledger</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Payables live in the ledger until requested; the licensed processor executes the regulated movement.
            </p>
          </div>
          {/* state machine legend */}
          <div className="flex flex-wrap items-center gap-2">
            {STATE_MACHINE.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ring-1 ring-white/10 ${s.tone}`}>
                  <s.Icon className="h-3 w-3" /> {s.key.replace('_', ' ')}
                </span>
                {i < STATE_MACHINE.length - 1 && <span className="text-emerald-100/30">→</span>}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* DERIVED OPERATOR BALANCES */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Landmark className="h-4 w-4" /> Operator balances · derived
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>ledger net − payouts</span>
        </div>
        {balances.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm font-semibold text-emerald-100/50">No operator earnings yet — balances are real zeros.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {balances.map((b, i) => (
              <motion.li key={b.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.05, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-white">{b.name}</p>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                    earned {formatN(b.earned)} · withdrawn {formatN(b.withdrawn)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Available</p>
                  <p className={`${display.className} text-xl font-black ${b.available > 0 ? 'text-emerald-300' : 'text-white'}`}>{formatN(b.available)}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* PAYOUT REQUESTS */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Wallet className="h-4 w-4" /> Payout requests
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{payouts.length} total</span>
        </div>
        {payouts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Wallet className="mx-auto h-8 w-8 text-emerald-300/40" />
            <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>No settlement requests yet</p>
            <p className="mt-1 text-sm font-medium text-emerald-100/50">When an operator requests a payout, it enters the state machine here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {payouts.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${statusTone(p.status)}`}>{p.status}</span>
                    <span className="text-sm font-bold text-white">{formatN(Number(p.amount) || 0)}</span>
                  </div>
                  <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                    {p.recipient_bank_name || '—'} ····{p.recipient_account_last4 || '—'} · {p.recipient_account_name || '—'}
                    {p.psp_reference && <> · PSP {p.psp_reference}</>}
                  </p>
                </div>
                <p className={`${mono.className} text-[10px] font-bold text-emerald-100/40`}>
                  {new Date(p.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* RULES ENGINE CARD */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22, ease: EASE }}
        className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          <ShieldCheck className="h-4 w-4" /> Settlement rules · policy
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { band: '₦0 – ₦500k', rule: 'Automatic settlement', tone: 'text-emerald-300' },
            { band: '₦500k – ₦5M', rule: 'Admin review', tone: 'text-amber-300' },
            { band: '> ₦5M', rule: 'Enhanced review', tone: 'text-rose-300' },
          ].map((r) => (
            <div key={r.band} className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <p className={`${display.className} text-lg font-black ${r.tone}`}>{r.band}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-100/60">{r.rule}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold text-emerald-100/40">
          Rules live in the settlement engine (Phase A2 hardening), never in the UI. A settlement is never "completed" on request — it must reach processor confirmation.
        </p>
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <TriangleAlert className="h-3.5 w-3.5 text-amber-300" /> Trakbin owns financial state · the processor moves money
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Wallet className="h-3.5 w-3.5" /> Trakbin Settlements
        </span>
      </motion.footer>
    </div>
  );
}