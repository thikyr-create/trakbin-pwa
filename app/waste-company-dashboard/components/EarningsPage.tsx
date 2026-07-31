"use client";

import { useEffect, useMemo } from 'react';
import { motion, animate, useMotionValue, useTransform, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { Wallet, TrendingUp, Receipt, Percent, Building2, ArrowDownRight, Activity, Landmark, Sparkles } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { formatNaira, bpsToPercent } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Counter({ value, prefix = '', duration = 1.2 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const row: Variants = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } } };

export default function EarningsPage() {
  const { earnings, settlements, fetchEarnings } = useCompanySession();
  useEffect(() => { fetchEarnings(); }, []);

  const available = earnings?.available ?? 0;
  const lifetime = earnings?.lifetime ?? 0;
  const rateBps = earnings?.rateBps ?? 1000;
  const platformPaid = useMemo(() => settlements.reduce((s, t) => s + (Number(t.commission) || 0), 0), [settlements]);
  const settledCount = settlements.length;

  return (
    <div className={`${body.className} space-y-6`}>
      {/* TREASURY HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70"><Landmark className="h-4 w-4" /> Treasury · available to you</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/30">
              <Percent className="h-3.5 w-3.5" /> platform fee {bpsToPercent(rateBps)}
            </span>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <span className={`${display.className} text-6xl font-extrabold leading-[0.9] tracking-tight tabular-nums sm:text-7xl`}>
              <Counter value={available} prefix="₦" />
            </span>
            <motion.span className="mb-2 inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 ring-1 ring-white/10" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-100">live</span>
            </motion.span>
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-100/70">Net of platform fees · accrues the instant a caretaker's payment settles</p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/60"><TrendingUp className="h-3.5 w-3.5" /> Lifetime earned</p>
              <p className="mt-1 text-2xl font-black tabular-nums"><Counter value={lifetime} prefix="₦" /></p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/60"><Receipt className="h-3.5 w-3.5" /> Platform fees paid</p>
              <p className="mt-1 text-2xl font-black tabular-nums"><Counter value={platformPaid} prefix="₦" /></p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/60"><Sparkles className="h-3.5 w-3.5" /> Settlements</p>
              <p className="mt-1 text-2xl font-black tabular-nums"><Counter value={settledCount} /></p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SETTLEMENT LEDGER — each row a stacked split bar (you vs platform) */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
          <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Wallet className="h-4 w-4" /></span>
            Settlements
          </h2>
          <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-gray-400"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> your net</span>
            <span className="flex items-center gap-1.5 text-gray-400"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> platform fee</span>
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="relative px-6 py-16 text-center sm:px-8">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Wallet className="h-7 w-7 text-gray-300" /></div>
            <p className="relative mt-4 text-sm font-bold text-gray-700">No settlements yet</p>
            <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">When a caretaker you serve pays an invoice, the net lands here and the platform fee is shown transparently beside it.</p>
          </div>
        ) : (
          <motion.ol variants={list} initial="hidden" animate="show" className="divide-y divide-gray-100">
            {settlements.map((t) => {
              const gross = Number(t.gross) || 0;
              const net = Number(t.net) || 0;
              const comm = Number(t.commission) || 0;
              const netPct = gross ? (net / gross) * 100 : 100;
              return (
                <motion.li key={t.id} variants={row} className="group px-6 py-5 transition-colors hover:bg-gray-50/70 sm:px-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-transform group-hover:scale-105"><ArrowDownRight className="h-5 w-5" /></span>
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                          {t.building_id}
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">settled</span>
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] font-semibold text-gray-400">{new Date(t.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${display.className} text-lg font-extrabold tabular-nums text-emerald-700`}>+{formatNaira(net)}</p>
                      <p className="font-mono text-[11px] font-semibold text-gray-400">of {formatNaira(gross)} · fee {formatNaira(comm)}</p>
                    </div>
                  </div>
                  {/* the split, visualized */}
                  <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.span initial={{ width: 0 }} animate={{ width: `${netPct}%` }} transition={{ duration: 0.7, ease: EASE }} className="bg-emerald-500" />
                    <motion.span initial={{ width: 0 }} animate={{ width: `${100 - netPct}%` }} transition={{ duration: 0.7, ease: EASE }} className="bg-slate-300" />
                  </div>
                </motion.li>
              );
            })}
          </motion.ol>
        )}
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Figures reconcile to the immutable ledger · {bpsToPercent(rateBps)} platform fee applied per settlement</span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">payouts · coming soon</span>
      </motion.footer>
    </div>
  );
}