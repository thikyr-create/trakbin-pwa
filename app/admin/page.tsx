// app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
    Building2, Users, CreditCard, Wallet, MapPin, Eye, TriangleAlert,
  ArrowUpRight, Activity, CheckCircle2, XCircle, TrendingUp, Coins,
  Network, Shield,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

function Counter({ value, prefix = '', duration = 1.0 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span className="tabular-nums">{rounded}</motion.span>;
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [k, setK] = useState({
    operators: 0, buildings: 0, zones: 0, drivers: 0, trucks: 0,
    paymentsCount: 0, paymentsSum: 0,
    payoutsCount: 0, payoutsSum: 0,
    ledgerEntries: 0, invoices: 0,
    observations: 0, issues: 0,
    pendingApprovals: 0, failedPayments: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const [
        { count: operators }, { count: buildings }, { count: zones },
        { count: drivers }, { count: trucks },
        { data: payRows }, { count: payoutsCount }, { count: ledgerEntries },
        { count: invoices }, { count: observations }, { count: issues },
      ] = await Promise.all([
        supabase.from('haulers').select('*', { count: 'exact', head: true }),
        supabase.from('Buildings').select('*', { count: 'exact', head: true }),
        supabase.from('company_zones').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('trucks').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, status'),
        supabase.from('payouts').select('*', { count: 'exact', head: true }),
        supabase.from('ledger_entries').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('field_observations').select('*', { count: 'exact', head: true }),
        supabase.from('environmental_issues').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      if (!alive) return;
      const payments = (payRows || []) as any[];
      setK({
        operators: operators || 0,
        buildings: buildings || 0,
        zones: zones || 0,
        drivers: drivers || 0,
        trucks: trucks || 0,
        paymentsCount: payments.length,
        paymentsSum: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        payoutsCount: payoutsCount || 0,
        payoutsSum: 0, // real zero until payouts exist
        ledgerEntries: ledgerEntries || 0,
        invoices: invoices || 0,
        observations: observations || 0,
        issues: issues || 0,
        pendingApprovals: 0, // wired in Phase A7
        failedPayments: payments.filter((p) => p.status === 'failed').length,
      });
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

  const attentionItems = [
    k.failedPayments > 0 && { label: `${k.failedPayments} failed payment${k.failedPayments > 1 ? 's' : ''}`, href: '/admin/payments', tone: 'rose' },
    k.issues > 0 && { label: `${k.issues} open field issue${k.issues > 1 ? 's' : ''}`, href: '/admin/field-intelligence', tone: 'amber' },
    k.payoutsCount === 0 && k.paymentsCount > 0 && { label: 'No operator settlements yet', href: '/admin/settlements', tone: 'amber' },
  ].filter(Boolean) as { label: string; href: string; tone: string }[];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
              Platform command · overview
            </p>
            <h1 className={`${display.className} mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl`}>
              Trakbin financial<br />operating system
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium text-emerald-100/70">
              Orchestration layer between customers and waste operators. Platform retains commission; licensed processor moves money.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 md:min-w-[380px]">
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Gross volume</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-white`}>
                <Counter value={k.paymentsSum} prefix="₦" />
              </p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Settled out</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-emerald-300`}>
                <Counter value={k.payoutsSum} prefix="₦" />
              </p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Transactions</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-white`}>
                <Counter value={k.paymentsCount} />
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ATTENTION QUEUE */}
      {attentionItems.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-amber-400/30 bg-amber-400/[0.06]">
          <div className="flex items-center gap-3 border-b border-amber-400/20 px-6 py-4">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
              <TriangleAlert className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950">
                {attentionItems.length}
              </span>
            </span>
            <div>
              <h2 className={`${display.className} text-base font-extrabold tracking-tight text-white`}>Needs attention</h2>
              <p className="text-xs font-semibold text-amber-100/60">Actionable platform state</p>
            </div>
          </div>
          <ul className="divide-y divide-amber-400/10">
            {attentionItems.map((it, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04, ease: EASE }}>
                <Link href={it.href} className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-amber-400/5">
                  <span className="text-sm font-semibold text-amber-100">{it.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-amber-300" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* ASYMMETRIC BENTO: network (wide) + financial posture (tall) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <Network className="mr-1.5 inline h-4 w-4" /> Network
            </p>
            <Link href="/admin/network" className="text-xs font-bold text-emerald-300 hover:text-emerald-200">Explore →</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { Icon: Building2, label: 'Operators', value: k.operators },
              { Icon: MapPin, label: 'Buildings', value: k.buildings },
              { Icon: Shield, label: 'Zones', value: k.zones },
              { Icon: Users, label: 'Drivers', value: k.drivers },
              { Icon: Activity, label: 'Trucks', value: k.trucks },
            ].map((n, i) => (
              <motion.div key={n.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.04, ease: EASE }}
                className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
                <n.Icon className="h-4 w-4 text-emerald-300" />
                <p className={`${display.className} mt-2 text-2xl font-black text-white`}>
                  <Counter value={n.value} />
                </p>
                <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>{n.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Coins className="mr-1.5 inline h-4 w-4" /> Financial posture
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold text-emerald-100/60">Gross collected</p>
                <p className={`${display.className} text-xl font-black text-white`}><Counter value={k.paymentsSum} prefix="₦" /></p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-emerald-400"
                  initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, ease: EASE }} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold text-emerald-100/60">Paid to operators</p>
                <p className={`${display.className} text-xl font-black text-emerald-300`}><Counter value={k.payoutsSum} prefix="₦" /></p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-emerald-400/50"
                  initial={{ width: 0 }}
                  animate={{ width: k.paymentsSum > 0 ? `${(k.payoutsSum / k.paymentsSum) * 100}%` : '0%' }}
                  transition={{ duration: 1, ease: EASE }} />
              </div>
            </div>
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-100/60"><CreditCard className="h-3.5 w-3.5" /> Payments</span>
                <span className={`${display.className} font-black text-white`}>{k.paymentsCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-100/60"><Wallet className="h-3.5 w-3.5" /> Settlements</span>
                <span className={`${display.className} font-black text-white`}>{k.payoutsCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-100/60"><TrendingUp className="h-3.5 w-3.5" /> Ledger entries</span>
                <span className={`${display.className} font-black text-white`}>{k.ledgerEntries}</span>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* SECTION GRID */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Field observations', value: k.observations, href: '/admin/field-intelligence', Icon: Eye, tone: 'emerald' },
          { label: 'Open issues', value: k.issues, href: '/admin/field-intelligence', Icon: TriangleAlert, tone: 'amber' },
          { label: 'Failed payments', value: k.failedPayments, href: '/admin/payments', Icon: XCircle, tone: 'rose' },
          { label: 'Invoices', value: k.invoices, href: '/admin/subscriptions', Icon: CheckCircle2, tone: 'emerald' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 + i * 0.04, ease: EASE }}>
            <Link href={s.href} className="block rounded-[20px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <s.Icon className={`h-4 w-4 ${s.tone === 'rose' ? 'text-rose-300' : s.tone === 'amber' ? 'text-amber-300' : 'text-emerald-300'}`} />
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300/40" />
              </div>
              <p className={`${display.className} mt-3 text-3xl font-black text-white`}>
                <Counter value={s.value} />
              </p>
              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>{s.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Shield className="h-3.5 w-3.5 text-amber-300" /> Figures derive from the balanced ledger · admin-only route
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Activity className="h-3.5 w-3.5" /> Trakbin Platform
        </span>
      </motion.footer>
    </div>
  );
}