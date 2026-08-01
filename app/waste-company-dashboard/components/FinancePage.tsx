"use client";

import { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  Wallet, ArrowUpRight, Clock, TrendingUp, Landmark, Plus, ShieldCheck,
  Activity, Receipt, CheckCircle2, Loader2, XCircle, Radio,
} from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { formatNaira, bpsToPercent } from '@/lib/utils/money';
import PayoutRequestSheet from './PayoutRequestSheet';
import CompanyRecipientSheet from './CompanyRecipientSheet';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Counter({ value, prefix = '', duration = 1.1 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const STATUS: Record<string, { label: string; chip: string; node: string }> = {
  requested:  { label: 'Reserved · queued',   chip: 'bg-amber-50 text-amber-700 ring-amber-200',  node: 'bg-amber-400' },
  processing: { label: 'Processing',          chip: 'bg-sky-50 text-sky-700 ring-sky-200',        node: 'bg-sky-400' },
  paid:       { label: 'Paid to bank',        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', node: 'bg-emerald-500' },
  failed:     { label: 'Failed · refunded',   chip: 'bg-rose-50 text-rose-700 ring-rose-200',     node: 'bg-rose-400' },
  cancelled:  { label: 'Cancelled',           chip: 'bg-gray-100 text-gray-600 ring-gray-200',    node: 'bg-gray-400' },
};
const STAGES = ['requested', 'processing', 'paid'] as const;

export default function FinancePage() {
  const { earnings, settlements, payouts, recipients, fetchEarnings } = useCompanySession();
  const [showPayout, setShowPayout] = useState(false);
  const [showRecipient, setShowRecipient] = useState(false);

  useEffect(() => { fetchEarnings(); }, []);

  const available = earnings?.available ?? 0;
  const pending = earnings?.pending ?? 0;
  const withdrawn = earnings?.withdrawn ?? 0;
  const lifetime = earnings?.lifetime ?? 0;
  const platformPaid = settlements.reduce((s: number, t: any) => s + (Number(t.commission) || 0), 0);

  const tiles = [
    { Icon: Clock, label: 'Reserved', value: pending, accent: 'text-amber-600', live: pending > 0 },
    { Icon: TrendingUp, label: 'Lifetime revenue', value: lifetime, accent: 'text-emerald-700' },
    { Icon: ArrowUpRight, label: 'Withdrawn', value: withdrawn, accent: 'text-gray-900' },
    { Icon: Receipt, label: 'Platform fees', value: platformPaid, accent: 'text-gray-500' },
  ];

  return (
    <div className={`${body.className} space-y-5`}>
      {/* treasury hero */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70"><Wallet className="h-4 w-4" /> Available to withdraw</p>
            <div className="mt-2 flex items-end gap-3">
              <span className={`${display.className} text-6xl font-extrabold leading-[0.9] tracking-tight tabular-nums sm:text-7xl`}><Counter value={available} prefix="₦" /></span>
              {pending > 0 && (
                <motion.span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/30" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Clock className="h-3.5 w-3.5" /> {formatNaira(pending)} in flight
                </motion.span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-emerald-100/70">Net of platform fees · {bpsToPercent(earnings?.rateBps ?? 1000)} applied per settlement</p>
          </div>

          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center self-start lg:self-auto">
            <motion.span aria-hidden className="absolute inset-0 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} style={{ background: 'conic-gradient(from 0deg, rgba(110,231,183,0.5), transparent 40%)' }} />
            <span className="absolute inset-2 rounded-full border border-emerald-300/20" />
            <span className="absolute inset-5 rounded-full border border-emerald-300/15" />
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" /></span>
          </div>
        </div>

        <div className="relative z-10 mt-7 flex flex-col gap-3 sm:flex-row">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowPayout(true)} disabled={available < 1000} className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-extrabold text-emerald-700 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-emerald-100/50 disabled:shadow-none">
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /> Request payout
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowRecipient(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-bold text-emerald-100 ring-1 ring-white/15 transition-colors hover:bg-white/20"><Landmark className="h-4 w-4" /> Payout accounts</motion.button>
        </div>
      </motion.section>

      {/* posture strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => {
          const Icon = t.Icon;
          return (
            <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }} whileHover={{ y: -3 }} className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-100"><Icon className="h-4 w-4" /></span>
                {t.live && <motion.span className="h-1.5 w-1.5 rounded-full bg-amber-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />}
              </div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{t.label}</p>
              <p className={`${display.className} mt-0.5 text-2xl font-extrabold tabular-nums ${t.accent}`}><Counter value={t.value} prefix="₦" /></p>
            </motion.div>
          );
        })}
      </div>

      {/* payouts + recipients */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* payouts ledger */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><ArrowUpRight className="h-4 w-4" /></span> Payouts</h2>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{payouts.length} total</span>
          </div>
          {payouts.length === 0 ? (
            <div className="relative px-6 py-16 text-center">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><ArrowUpRight className="h-7 w-7 text-gray-300" /></div>
              <p className="relative mt-4 text-sm font-bold text-gray-700">No payouts yet</p>
              <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Request your first payout to move available earnings toward your bank.</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPayout(true)} className="relative mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Request payout</motion.button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {payouts.map((p: any, i: number) => {
                const st = STATUS[p.status] || STATUS.requested;
                const stageIdx = STAGES.indexOf(p.status as any);
                return (
                  <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} className="px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-bold text-gray-900">{formatNaira(p.amount)} <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${st.chip}`}>{st.label}</span></p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-gray-500"><Landmark className="h-3 w-3" /> {p.recipient_bank_name} •••• {p.recipient_account_last4} · {p.recipient_account_name}</p>
                      </div>
                      <p className="font-mono text-[11px] font-semibold text-gray-400">{new Date(p.requested_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {/* mini lifecycle */}
                    <div className="mt-3 flex items-center gap-2">
                      {STAGES.map((s, idx) => {
                        const reached = p.status === 'failed' ? idx === 0 : stageIdx >= idx;
                        const current = p.status === s || (p.status === 'failed' && idx === 0);
                        return (
                          <div key={s} className="flex flex-1 items-center gap-2">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${reached ? (p.status === 'failed' ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-gray-200'}`}>
                              {p.status === 'failed' && idx === 0 ? <XCircle className="h-3 w-3 text-white" /> : reached ? <CheckCircle2 className="h-3 w-3 text-white" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              {current && p.status !== 'paid' && p.status !== 'failed' && <span className="absolute h-5 w-5 animate-ping rounded-full bg-emerald-300/50" />}
                            </span>
                            {idx < STAGES.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${reached && p.status !== 'failed' ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {/* recipients */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-100"><Landmark className="h-4 w-4" /></span> Payout accounts</h2>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowRecipient(true)} className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"><Plus size={14} /> Add</motion.button>
          </div>
          {recipients.length === 0 ? (
            <div className="px-6 py-12 text-center"><Landmark className="mx-auto h-6 w-6 text-gray-300" /><p className="mt-2 text-sm font-bold text-gray-700">No accounts yet</p><p className="mt-1 text-xs text-gray-400">Add a verified bank account to receive payouts.</p></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recipients.map((r: any, i: number) => (
                <motion.li key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} className="flex items-center gap-3 px-6 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-100"><Landmark className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{r.bank_name} •••• {r.account_last4}</p>
                    <p className="truncate text-xs font-semibold text-gray-500">{r.account_name}</p>
                  </div>
                  {r.recipient_code ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">live</span>
                    : <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200">staged</span>}
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* recent settlements (continuity with the earnings view) */}
      {settlements.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Activity className="h-4 w-4" /></span> Recent settlements</h2>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">net · fee</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {settlements.slice(0, 8).map((t: any) => {
              const gross = Number(t.gross) || 0; const net = Number(t.net) || 0; const comm = Number(t.commission) || 0;
              const netPct = gross ? (net / gross) * 100 : 100;
              return (
                <li key={t.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] font-semibold text-gray-400">{new Date(t.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })} · {t.building_id}</p>
                    <p className="text-sm font-bold text-gray-900">{formatNaira(net)} <span className="font-semibold text-gray-400">· fee {formatNaira(comm)}</span></p>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span className="bg-emerald-500" style={{ width: `${netPct}%` }} /><span className="bg-slate-300" style={{ width: `${100 - netPct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      <PayoutRequestSheet open={showPayout} onClose={() => setShowPayout(false)} />
      <CompanyRecipientSheet open={showRecipient} onClose={() => setShowRecipient(false)} />
    </div>
  );
}