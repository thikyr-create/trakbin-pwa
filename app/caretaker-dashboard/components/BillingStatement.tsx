"use client";

import { motion, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { Receipt, ArrowUpRight, ArrowDownRight, Wallet, Plus, Activity } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { formatNaira } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const row: Variants = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } };

export default function BillingStatement() {
  const { ledger, walletBalance } = useCaretakerSession();
  const recent = ledger.slice(0, 5);

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative mb-10 overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-7 shadow-sm sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
      <motion.span aria-hidden initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }} className="absolute inset-y-6 left-0 w-1 origin-top rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />

      <div className="relative z-10 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600/80"><Receipt className="h-3.5 w-3.5" /> Statement · recent activity</p>
          <h3 className={`${display.className} mt-1 text-2xl font-extrabold tracking-tight text-gray-900`}>Payment history</h3>
        </div>
        <div className="rounded-2xl bg-gray-50 px-4 py-2.5 ring-1 ring-gray-100">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Wallet balance</p>
          <p className={`${display.className} text-xl font-extrabold tabular-nums text-gray-900`}>{formatNaira(walletBalance)}</p>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="relative z-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center">
          <Wallet className="mx-auto h-6 w-6 text-gray-300" />
          <p className="mt-2 text-sm font-bold text-gray-700">No activity yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400">Top‑ups and payments appear here in order, with the amount taken from your wallet.</p>
        </div>
      ) : (
        <motion.ol variants={list} initial="hidden" animate="show" className="relative z-10 divide-y divide-gray-100">
          {recent.map((t) => {
            const isTopup = t.type === 'topup';
            const gross = Number(t.gross) || 0;
            return (
              <motion.li key={t.id} variants={row} className="group flex items-center gap-4 py-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${isTopup ? 'bg-sky-50 text-sky-600 ring-sky-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'}`}>
                  {isTopup ? <Plus className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    {isTopup ? 'Wallet top‑up' : 'Service payment'}
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500">{t.status}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-gray-400">{isTopup ? 'Funds added to wallet' : 'Invoice paid from wallet'}</p>
                </div>
                <div className="text-right">
                  <p className={`${display.className} text-base font-extrabold tabular-nums ${isTopup ? 'text-sky-600' : 'text-gray-900'}`}>{isTopup ? '+' : '−'}{formatNaira(gross)}</p>
                  <p className="font-mono text-[10px] font-semibold text-gray-400">{new Date(t.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      )}

      <p className="relative z-10 mt-5 flex items-center gap-2 text-xs font-medium text-gray-400">
        <Activity className="h-3.5 w-3.5 text-emerald-500" /> Every top‑up and payment, recorded in order · full history on the billing page
      </p>
    </motion.section>
  );
}