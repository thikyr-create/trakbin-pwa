// app/admin/page.tsx
"use client";

import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Building2, Users, CreditCard, Wallet, MapPin, Eye, TriangleAlert,
  ArrowUpRight, Activity, Crown, Receipt, Network, Truck,
} from 'lucide-react';
import Link from 'next/link';
import { usePlatformOverview } from '@/lib/super-admin/hooks/usePlatformOverview';
import { usePlatformAnalytics } from '@/lib/super-admin/hooks/usePlatformAnalytics';
import { useSubscriptions } from '@/lib/super-admin/hooks/useSubscriptions';
import { useIntelligence } from '@/lib/super-admin/hooks/useIntelligence';
import type { SeriesPoint } from '@/lib/super-admin/services/platform-analytics.service';

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

function PendingTag() {
  return <span className={`${mono.className} ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-100/50`}>A7R</span>;
}

export default function AdminOverviewPage() {
  const { overview: o, attention, activity, loading } = usePlatformOverview();
  const { a: pa } = usePlatformAnalytics();
  const { subs } = useSubscriptions();
  const { intel } = useIntelligence();

  if (loading || !o) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const expiringCount = subs.filter((s) =>
    s.status === 'expiring' ||
    (s.periodEnd && ['active', 'trial'].includes(s.status) && new Date(s.periodEnd).getTime() - Date.now() < 7 * 864e5)).length;
  const mrr = subs.filter((s) => s.status === 'active').reduce((s, x) => s + x.monthlyFee, 0);

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
              How is Trakbin<br />performing?
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium text-emerald-100/70">
              Who is using the platform, what they pay us, and whether everything is functioning correctly.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Organizations</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-white`}><Counter value={o.organizations} /></p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>MRR</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-emerald-300`}><Counter value={o.mrr} prefix="₦" /></p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Collections</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-white`}><Counter value={o.collectionsVolume} prefix="₦" /></p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ATTENTION REQUIRED */}
      {attention.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-amber-400/30 bg-amber-400/[0.06]">
          <div className="flex items-center gap-3 border-b border-amber-400/20 px-6 py-4">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
              <TriangleAlert className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950">{attention.length}</span>
            </span>
            <div>
              <h2 className={`${display.className} text-base font-extrabold tracking-tight text-white`}>Attention required</h2>
              <p className="text-xs font-semibold text-amber-100/60">Actionable platform state</p>
            </div>
          </div>
          <ul className="divide-y divide-amber-400/10">
            {attention.map((it, i) => (
              <motion.li key={it.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04, ease: EASE }}>
                <Link href={it.href} className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-amber-400/5">
                  <span className="text-sm font-semibold text-amber-100">{it.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-amber-300" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* KPI BENTO */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { Icon: Building2, label: 'Organizations', value: o.organizations, href: '/admin/organizations' },
          { Icon: Crown, label: 'Active subscriptions', value: o.activeSubscriptions, href: '/admin/subscriptions', tag: true },
          { Icon: MapPin, label: 'Properties', value: o.properties, href: '/admin/network' },
          { Icon: Network, label: 'Zones', value: o.zones, href: '/admin/network' },
          { Icon: Truck, label: 'Active operators', value: o.activeOperators, href: '/admin/organizations' },
          { Icon: Users, label: 'Active drivers', value: o.activeDrivers, href: '/admin/network' },
          { Icon: CreditCard, label: 'Collections processed', value: o.collectionsProcessed, href: '/admin/billing' },
          { Icon: Eye, label: 'Field observations', value: o.fieldObservations, href: '/admin/field-intelligence' },
          { Icon: TriangleAlert, label: 'Platform incidents', value: o.platformIncidents, href: '/admin/health' },
          { Icon: Receipt, label: 'Overdue invoices', value: o.overdueInvoices, href: '/admin/billing' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.03, ease: EASE }}>
            <Link href={s.href} className="block rounded-[20px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <s.Icon className="h-4 w-4 text-emerald-300" />
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300/40" />
              </div>
              <p className={`${display.className} mt-3 text-3xl font-black text-white`}><Counter value={s.value} /></p>
              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>
                {s.label}{(s as any).tag && <PendingTag />}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* GROWTH + HEALTH STRIPS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SparkCard title="Platform growth" series={pa?.orgSeries || []} value={o.organizations} suffix="orgs" />
        <SparkCard title="Network growth" series={pa?.propertySeries || []} value={o.properties} suffix="properties" />
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/70`}>Subscription health</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xs font-bold text-emerald-300">{subs.filter((s) => s.status === 'active').length} active</span>
            <span className="text-xs font-bold text-blue-300">{subs.filter((s) => s.status === 'trial').length} trial</span>
            <span className="text-xs font-bold text-amber-300">{expiringCount} expiring</span>
          </div>
          <p className={`${display.className} mt-3 text-2xl font-black text-white`}>{formatN(mrr)}<span className="ml-1 text-[10px] text-emerald-100/50">MRR</span></p>
        </motion.section>
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/70`}>Field intelligence snapshot</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xs font-bold text-white">{intel?.totals.observations ?? 0} obs</span>
            <span className="text-xs font-bold text-emerald-300">{intel?.totals.corrections ?? 0} corrections</span>
          </div>
          <p className={`${display.className} mt-3 text-2xl font-black text-white`}>
            {intel && intel.totals.observations ? Math.round((intel.confidence.high / intel.totals.observations) * 100) : 0}%<span className="ml-1 text-[10px] text-emerald-100/50">high confidence</span>
          </p>
        </motion.section>
      </div>

      {/* REVENUE SNAPSHOT + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Revenue snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Gross collected</p>
              <p className={`${display.className} mt-1 text-xl font-black text-white`}><Counter value={o.revenue.grossCollected} prefix="₦" /></p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Commission</p>
              <p className={`${display.className} mt-1 text-xl font-black text-emerald-300`}><Counter value={o.revenue.commissionRetained} prefix="₦" /></p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Operator payable</p>
              <p className={`${display.className} mt-1 text-xl font-black text-white`}><Counter value={o.revenue.operatorPayable} prefix="₦" /></p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Settled out</p>
              <p className={`${display.className} mt-1 text-xl font-black text-white`}><Counter value={o.revenue.settledOut} prefix="₦" /></p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-emerald-100/40">
            Payment volume is not revenue. Commission + subscriptions are revenue.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Activity className="h-4 w-4" /> Recent platform activity
          </p>
          {activity.length === 0 ? (
            <p className="mt-5 text-sm font-semibold text-emerald-100/50">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <motion.li key={a.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.04, ease: EASE }}
                  className="border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <p className="text-xs font-bold text-white">{a.label}</p>
                  <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                    {a.kind} · {new Date(a.at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Wallet className="h-3.5 w-3.5 text-emerald-300" /> Trakbin owns financial state · the processor moves money
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Activity className="h-3.5 w-3.5" /> Trakbin Platform
        </span>
      </motion.footer>
    </div>
  );
}

function SparkCard({ title, series, value, suffix }: { title: string; series: SeriesPoint[]; value: number; suffix: string }) {
  const max = Math.max(1, ...series.map((s) => s.total));
  const pts = series.map((s, i) => `${(i * 100) / Math.max(1, series.length - 1)},${30 - (s.total / max) * 26}`).join(' ');
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between">
        <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/70`}>{title}</p>
        <p className={`${display.className} text-xl font-black text-white`}>{value}<span className="ml-1 text-[10px] text-emerald-100/50">{suffix}</span></p>
      </div>
      <svg viewBox="0 0 100 32" className="mt-3 h-10 w-full overflow-visible">
        <polyline points={pts} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.section>
  );
}