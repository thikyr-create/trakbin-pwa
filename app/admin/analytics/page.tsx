// app/admin/analytics/page.tsx
"use client";

import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  BarChart3, TrendingUp, Building2, MapPin, Coins, Eye, Crown, Radio, Repeat,
} from 'lucide-react';
import { usePlatformAnalytics } from '@/lib/super-admin/hooks/usePlatformAnalytics';
import { resolvePlan } from '@/lib/super-admin/config/plans';
import type { SeriesPoint } from '@/lib/super-admin/services/platform-analytics.service';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

function areaPath(series: SeriesPoint[], w: number, h: number) {
  if (!series.length) return { line: '', fill: '' };
  const max = Math.max(1, ...series.map((s) => s.total));
  const step = w / Math.max(1, series.length - 1);
  const pts = series.map((s, i) => [i * step, h - (s.total / max) * (h - 8) - 4] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = `${line} L${w},${h} L0,${h} Z`;
  return { line, fill };
}

function Chart({ title, Icon, series, money }: { title: string; Icon: any; series: SeriesPoint[]; money?: boolean }) {
  const { line, fill } = areaPath(series, 320, 96);
  const total = series.reduce((s, x) => s + x.total, 0);
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between">
        <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          <Icon className="h-4 w-4" /> {title}
        </p>
        <span className={`${display.className} text-lg font-black tabular-nums text-white`}>
          {money ? formatN(total) : total}
        </span>
      </div>
      <svg viewBox="0 0 320 96" className="mt-4 h-24 w-full overflow-visible">
        <defs>
          <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(16,185,129,0.45)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </linearGradient>
        </defs>
        {fill && <motion.path d={fill} fill={`url(#g-${title})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} />}
        {line && (
          <motion.path d={line} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE }} />
        )}
        {series.map((s, i) => {
          const max = Math.max(1, ...series.map((x) => x.total));
          const x = (i * 320) / Math.max(1, series.length - 1);
          const y = 96 - (s.total / max) * 88 - 4;
          return <motion.circle key={s.key} cx={x} cy={y} r="2.5" fill="#a7f3d0" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.03 }} />;
        })}
      </svg>
      <div className="mt-1 flex justify-between">
        {series.filter((_, i) => i % 3 === 0).map((s) => (
          <span key={s.key} className={`${mono.className} text-[8px] font-bold uppercase tracking-wider text-emerald-200/40`}>{s.label}</span>
        ))}
      </div>
    </motion.section>
  );
}

export default function AdminAnalyticsPage() {
  const { a, loading } = usePlatformAnalytics();

  if (loading || !a) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const maxPlan = Math.max(1, ...a.planPopularity.map((p) => p.count));

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
              Analytics · platform intelligence
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>
              How Trakbin grows
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Operators using the platform, retention, popular plans, growing regions, platform revenue.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>MRR</p><p className={`${display.className} mt-1 text-3xl font-black text-emerald-300`}>{formatN(a.mrr)}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>30-day retention</p><p className={`${display.className} mt-1 text-3xl font-black text-white`}>{a.retention.pct}%</p></div>
          </div>
        </div>
      </motion.section>

      {/* GROWTH CHARTS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Chart title="Platform growth · organizations" Icon={TrendingUp} series={a.orgSeries} />
        <Chart title="Network growth · properties" Icon={MapPin} series={a.propertySeries} />
        <Chart title="Revenue · commission retained" Icon={Coins} series={a.revenueSeries} money />
        <Chart title="Collections volume" Icon={BarChart3} series={a.paymentSeries} money />
        <Chart title="Zones deployed" Icon={Radio} series={a.zoneSeries} />
        <Chart title="Field observations" Icon={Eye} series={a.observationSeries} />
      </div>

      {/* PLAN POPULARITY + RETENTION + REGIONS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Crown className="h-4 w-4" /> Plan popularity
          </p>
          {a.planPopularity.length === 0 ? (
            <p className="mt-5 text-sm font-semibold text-emerald-100/50">No subscriptions yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {a.planPopularity.map((p, i) => (
                <motion.li key={p.plan} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.05, ease: EASE }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-extrabold text-white">{resolvePlan(p.plan).name}</span>
                    <span className={`${mono.className} text-xs font-bold text-emerald-300`}>{p.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }}
                      animate={{ width: `${(p.count / maxPlan) * 100}%` }} transition={{ duration: 0.8, ease: EASE }} />
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Repeat className="h-4 w-4" /> Retention
          </p>
          <p className={`${display.className} mt-4 text-5xl font-black text-white`}>{a.retention.pct}%</p>
          <p className="mt-1 text-sm font-semibold text-emerald-100/50">
            {a.retention.activeLast30d} of {a.retention.totalOrgs} organizations active in the last 30 days
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }} animate={{ width: `${a.retention.pct}%` }} transition={{ duration: 1, ease: EASE }} />
          </div>
          <p className="mt-4 text-xs font-semibold text-emerald-100/40">
            Active = ledger or settlement activity. Revenue behavior, not login vanity.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Building2 className="h-4 w-4" /> Regions growing
          </p>
          {a.topEstates.length === 0 ? (
            <p className="mt-5 text-sm font-semibold text-emerald-100/50">No properties yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {a.topEstates.map((e, i) => (
                <motion.li key={e.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04, ease: EASE }}
                  className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
                  <span className="text-xs font-bold text-white">{e.name}</span>
                  <span className={`${mono.className} text-[10px] font-bold text-emerald-300`}>{e.count} properties</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <BarChart3 className="h-3.5 w-3.5 text-emerald-300" /> Platform questions ≠ waste-company questions
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <BarChart3 className="h-3.5 w-3.5" /> Trakbin Analytics
        </span>
      </motion.footer>
    </div>
  );
}