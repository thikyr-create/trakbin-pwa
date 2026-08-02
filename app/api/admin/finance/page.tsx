"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Activity, TrendingUp, Wallet, ArrowUpRight, Receipt, RotateCcw, AlertTriangle,
  Radio, CheckCircle2, XCircle, Link2, ShieldAlert, Coins, LogOut,
} from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { formatNaira, bpsToPercent } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Counter({ value, prefix = '', duration = 1.2 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

function isAllowed(role: string | null): boolean {
  if (role === 'admin') return true;
  if (typeof window !== 'undefined' && window.localStorage.getItem('trakbin_admin') === '1') return true;
  return false;
}

// build an SVG area-chart path from the 12-bucket series
function areaPath(series: { total: number }[], w: number, h: number) {
  if (!series.length) return { line: '', fill: '' };
  const max = Math.max(1, ...series.map((s) => s.total));
  const step = w / (series.length - 1);
  const pts = series.map((s, i) => [i * step, h - (s.total / max) * (h - 8) - 4] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = `${line} L${w},${h} L0,${h} Z`;
  return { line, fill };
}

export default function AdminFinancePage() {
  const { tenant, loadTenantContext } = useCompanySession();
  const [data, setData] = useState<any>(null);
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [reconciling, setReconciling] = useState<Record<string, string>>({});

  useEffect(() => { loadTenantContext(); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [f, u] = await Promise.all([fetch('/api/admin/finance'), fetch('/api/admin/finance/unmatched')]);
      const fj = await f.json(); const uj = await u.json();
      if (!alive) return;
      if (fj.ok) setData(fj);
      if (uj.ok) setUnmatched(uj.events || []);
    })();
    return () => { alive = false; };
  }, []);

  const allowed = useMemo(() => isAllowed(tenant.role), [tenant.role, tenant.loaded]);

  const reconcile = async (eventId: string) => {
    const payoutId = prompt('Enter the payout ID this transfer belongs to:');
    if (!payoutId) return;
    setReconciling((r) => ({ ...r, [eventId]: payoutId }));
    const res = await fetch('/api/admin/finance/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, payoutId }) });
    const json = await res.json();
    setReconciling((r) => { const n = { ...r }; delete n[eventId]; return n; });
    if (json.ok) { setUnmatched((u) => u.filter((e) => e.id !== eventId)); }
    else alert(json.reason || json.error || 'Reconcile failed');
  };

  if (!tenant.loaded) {
    return <div className={`${body.className} flex min-h-screen items-center justify-center bg-[#0c1411]`}><motion.div className="h-12 w-12 rounded-full border-b-2 border-emerald-400" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} /></div>;
  }
  if (!allowed) {
    return (
      <div className={`${body.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c1411] p-6 text-emerald-50`}>
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="relative max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <ShieldAlert className="mx-auto h-9 w-9 text-amber-300" />
          <p className={`${display.className} mt-3 text-xl font-extrabold`}>Admin access only</p>
          <p className="mt-2 text-sm text-emerald-100/70">Sign in with an admin account, or set <span className={mono.className}>localStorage.trakbin_admin = '1'</span> for ops access. Real gating ships with the auth migration.</p>
        </div>
      </div>
    );
  }

  const series = data?.series || [];
  const { line, fill } = areaPath(series, 320, 96);
  const successRate = data?.counts?.total ? Math.round(((data.counts.success || 0) / data.counts.total) * 100) : 0;

  return (
    <div className={`${body.className} relative min-h-screen bg-[#0c1411] text-gray-100`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-700/10 blur-3xl" />
      </div>

      <header className="relative z-20 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500"><span className={`${display.className} text-lg font-black text-emerald-950`}>T</span></div>
            <div className="leading-none">
              <p className={`${display.className} text-base font-black tracking-tight text-white`}>Trakbin · Finance</p>
              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Platform control</p>
            </div>
          </div>
          <span className={`${mono.className} hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70 ring-1 ring-white/10 sm:flex`}><Radio className="h-3 w-3" /> MVP access</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        {/* ASYMMETRIC HERO: giant revenue + area chart | live ticker */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-7 lg:col-span-2">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
            <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}><Coins className="h-4 w-4" /> Platform revenue · retained</p>
                <p className={`${display.className} mt-2 text-6xl font-black leading-[0.9] tracking-tight tabular-nums text-white sm:text-7xl`}><Counter value={data?.platformRevenue ?? 0} prefix="₦" /></p>
                <p className="mt-2 text-sm font-medium text-emerald-100/70">Commission retained at {bpsToPercent(data?.commissionBps ?? 1000)} across all settlements</p>
              </div>
              {/* hand-drawn area chart */}
              <div className="w-full sm:w-[340px]">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60`}>Collections · 12 mo</span>
                  <span className={`${mono.className} text-[10px] font-bold tabular-nums text-emerald-300`}>{formatNaira(data?.totalCollections ?? 0)}</span>
                </div>
                <svg viewBox="0 0 320 96" className="h-24 w-full overflow-visible">
                  <defs>
                    <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(16,185,129,0.45)" />
                      <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                    </linearGradient>
                  </defs>
                  {fill && <motion.path d={fill} fill="url(#revfill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />}
                  {line && (
                    <motion.path d={line} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE }} />
                  )}
                  {series.map((s: any, i: number) => {
                    const max = Math.max(1, ...series.map((x: any) => x.total));
                    const x = (i * 320) / (series.length - 1); const y = 96 - (s.total / max) * 88 - 4;
                    return <motion.circle key={i} cx={x} cy={y} r="2.5" fill="#a7f3d0" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.04 }} />;
                  })}
                </svg>
                <div className="mt-1 flex justify-between">
                  {series.filter((_: any, i: number) => i % 3 === 0).map((s: any) => (
                    <span key={s.key} className={`${mono.className} text-[8px] font-bold uppercase tracking-wider text-emerald-200/40`}>{s.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* live ticker */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: EASE }} className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-6">
            <p className={`${mono.className} mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}><Activity className="h-4 w-4" /> Live posture</p>
            <div className="space-y-4">
              {[
                { Icon: TrendingUp, label: 'Total collections', value: data?.totalCollections ?? 0, tone: 'text-white' },
                { Icon: Wallet, label: 'Paid out to operators', value: data?.withdrawn ?? 0, tone: 'text-emerald-300' },
                { Icon: Receipt, label: 'Outstanding bills', value: data?.outstanding ?? 0, tone: 'text-amber-300' },
              ].map((r, i) => (
                <motion.div key={r.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08, ease: EASE }} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-100/70"><r.Icon className="h-4 w-4" /> {r.label}</span>
                  <span className={`${display.className} text-lg font-extrabold tabular-nums ${r.tone}`}><Counter value={r.value} prefix="₦" /></span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* VARIED BENTO — success/fail ratio (wide) | refunds (tall-ish) — NOT equal cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12, ease: EASE }} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Payment health</p>
              <span className={`${display.className} text-2xl font-black tabular-nums text-white`}>{successRate}<span className="text-base text-emerald-300">%</span></span>
            </div>
            <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-white/10">
              <motion.span initial={{ width: 0 }} animate={{ width: `${successRate}%` }} transition={{ duration: 1, ease: EASE }} className="bg-emerald-400" />
              <motion.span initial={{ width: 0 }} animate={{ width: `${100 - successRate}%` }} transition={{ duration: 1, ease: EASE }} className="bg-rose-400/70" />
            </div>
            <div className="mt-4 flex items-center gap-6">
              <span className="flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {data?.counts?.success ?? 0} successful</span>
              <span className="flex items-center gap-2 text-sm font-bold text-rose-300"><XCircle className="h-4 w-4" /> {data?.counts?.failed ?? 0} failed</span>
              <span className={`${mono.className} text-xs font-semibold text-emerald-100/40`}>{data?.counts?.total ?? 0} attempts</span>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: EASE }} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}><RotateCcw className="h-4 w-4" /> Refunds</p>
            <p className={`${display.className} mt-3 text-4xl font-black tabular-nums text-white`}><Counter value={data?.refundedTotal ?? 0} prefix="₦" /></p>
            <p className="mt-1 text-sm font-semibold text-emerald-100/50">{data?.counts?.refunded ?? 0} refunded · {data?.counts?.failed ?? 0} failed payouts auto‑refunded to available</p>
          </motion.section>
        </div>

        {/* RECONCILIATION QUEUE — full-width attention surface */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease: EASE }} className="mt-4 overflow-hidden rounded-[24px] border border-amber-400/30 bg-amber-400/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-400/20 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
                <AlertTriangle className="h-5 w-5" />
                {unmatched.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950">{unmatched.length}</span>}
              </span>
              <div>
                <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-white`}>Reconciliation queue</h2>
                <p className="text-xs font-semibold text-amber-100/60">Transfers the bank confirmed before we stored their reference — match each to its payout.</p>
              </div>
            </div>
            <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-amber-200/70`}>{unmatched.length} unmatched</span>
          </div>

          {unmatched.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Link2 className="mx-auto h-7 w-7 text-emerald-300/50" />
              <p className="mt-3 text-sm font-bold text-emerald-100/80">All transfers reconciled</p>
              <p className="mt-1 text-xs text-emerald-100/50">Every confirmed transfer matched a payout by reference. Nothing needs attention.</p>
            </div>
          ) : (
            <ul className="divide-y divide-amber-400/10">
              {unmatched.map((e: any, i: number) => (
                <motion.li key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className={`${mono.className} text-sm font-bold text-white`}>{e.transfer_code}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-amber-100/60">
                      <span className={e.status === 'success' ? 'text-emerald-300' : 'text-rose-300'}>{e.status}</span>
                      {e.amount != null && <>· {formatNaira(e.amount)}</>}
                      · {new Date(e.received_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => reconcile(e.id)} disabled={!!reconciling[e.id]} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-amber-950 transition-colors hover:bg-amber-300 disabled:bg-white/10 disabled:text-white/50">
                    <Link2 className="h-3.5 w-3.5" /> Match to payout
                  </motion.button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50"><ShieldAlert className="h-3.5 w-3.5 text-amber-300" /> Figures derive from the balanced ledger · gate this route with SSO in the auth migration</span>
          <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}><Activity className="h-3.5 w-3.5" /> Trakbin Platform</span>
        </motion.footer>
      </main>
    </div>
  );
}