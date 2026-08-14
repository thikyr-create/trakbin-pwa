// app/admin/field-intelligence/page.tsx
"use client";

import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Eye, Radio, Gauge, Wrench, TrendingUp, Sparkles, ArrowRight,
} from 'lucide-react';
import { useIntelligence } from '@/lib/super-admin/hooks/useIntelligence';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const LOOP = ['FIELD', 'OBSERVATION', 'DATA', 'INTELLIGENCE', 'CORRECTION', 'BETTER SYSTEM'];

function confTone(c: number | null) {
  if (c == null) return 'text-emerald-100/40 bg-white/5 ring-white/10';
  if (c >= 0.8) return 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30';
  if (c >= 0.5) return 'text-amber-300 bg-amber-400/10 ring-amber-300/30';
  return 'text-rose-300 bg-rose-400/10 ring-rose-300/30';
}

export default function AdminFieldIntelligencePage() {
  const { intel: n, loading } = useIntelligence();

  if (loading || !n) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const t = n.totals;
  const confTotal = n.confidence.high + n.confidence.medium + n.confidence.low + n.confidence.unknown;
  const pct = (x: number) => (confTotal ? Math.round((x / confTotal) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
            Field intelligence · platform-level loop
          </p>
          <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>
            How the network learns
          </h1>
          {/* the loop */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {LOOP.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`${mono.className} rounded-full bg-white/5 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-200/80 ring-1 ring-white/10`}>
                  {step}
                </span>
                {i < LOOP.length - 1 && <ArrowRight className="h-3 w-3 text-emerald-300/40" />}
              </div>
            ))}
            <ArrowRight className="h-3 w-3 text-emerald-300/40" />
            <span className={`${mono.className} rounded-full bg-emerald-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-300/30`}>
              FIELD
            </span>
          </div>
        </div>
      </motion.section>

      {/* KPI BENTO */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {[
          { Icon: Eye, label: 'Observations', value: t.observations },
          { Icon: Radio, label: 'Signals', value: t.signals },
          { Icon: Sparkles, label: 'Events', value: t.events },
          { Icon: Gauge, label: 'Feedback', value: t.feedback },
          { Icon: Wrench, label: 'Corrections', value: t.corrections },
          { Icon: TrendingUp, label: 'Intelligence rows', value: t.intelligence },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.03, ease: EASE }}
            className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
            <s.Icon className="h-4 w-4 text-emerald-300" />
            <p className={`${display.className} mt-2 text-2xl font-black text-white`}>{s.value}</p>
            <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* CONFIDENCE + DATA QUALITY */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Confidence distribution</p>
          {confTotal === 0 ? (
            <p className="mt-5 text-sm font-semibold text-emerald-100/50">No observations yet — confidence renders as soon as the field starts reporting.</p>
          ) : (
            <>
              <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-white/10">
                <motion.span initial={{ width: 0 }} animate={{ width: `${pct(n.confidence.high)}%` }} transition={{ duration: 1, ease: EASE }} className="bg-emerald-400" />
                <motion.span initial={{ width: 0 }} animate={{ width: `${pct(n.confidence.medium)}%` }} transition={{ duration: 1, ease: EASE }} className="bg-amber-400" />
                <motion.span initial={{ width: 0 }} animate={{ width: `${pct(n.confidence.low)}%` }} transition={{ duration: 1, ease: EASE }} className="bg-rose-400/70" />
                <motion.span initial={{ width: 0 }} animate={{ width: `${pct(n.confidence.unknown)}%` }} transition={{ duration: 1, ease: EASE }} className="bg-white/20" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-6 text-sm font-bold">
                <span className="flex items-center gap-2 text-emerald-300">≥80% · {n.confidence.high}</span>
                <span className="flex items-center gap-2 text-amber-300">50–79% · {n.confidence.medium}</span>
                <span className="flex items-center gap-2 text-rose-300">&lt;50% · {n.confidence.low}</span>
                <span className="flex items-center gap-2 text-emerald-100/40">unscored · {n.confidence.unknown}</span>
              </div>
            </>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Data quality</p>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold text-emerald-100/60">Scored observations</p>
                <p className={`${display.className} text-lg font-black text-white`}>{n.quality.total ? Math.round((n.quality.withConfidence / n.quality.total) * 100) : 0}%</p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }}
                  animate={{ width: `${n.quality.total ? (n.quality.withConfidence / n.quality.total) * 100 : 0}%` }} transition={{ duration: 1, ease: EASE }} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold text-emerald-100/60">Corrections applied</p>
                <p className={`${display.className} text-lg font-black text-white`}>{n.quality.correctionsTotal ? Math.round((n.quality.correctionsApplied / n.quality.correctionsTotal) * 100) : 0}%</p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-emerald-400" initial={{ width: 0 }}
                  animate={{ width: `${n.quality.correctionsTotal ? (n.quality.correctionsApplied / n.quality.correctionsTotal) * 100 : 0}%` }} transition={{ duration: 1, ease: EASE }} />
              </div>
            </div>
            <p className="text-xs font-semibold text-emerald-100/40">
              Corrections that land improve the next observation. That is the loop.
            </p>
          </div>
        </motion.section>
      </div>

      {/* PATTERNS + OBSERVATIONS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Patterns · most observed nodes</p>
          {n.patterns.length === 0 ? (
            <p className="mt-5 text-sm font-semibold text-emerald-100/50">No patterns yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {n.patterns.map((p, i) => (
                <motion.li key={p.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.04, ease: EASE }}
                  className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/5">
                  <span className="text-xs font-bold text-white">{p.key}</span>
                  <span className={`${mono.className} text-[10px] font-bold text-emerald-300`}>{p.count} obs</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <Eye className="h-4 w-4" /> Latest observations
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{n.observations.length}</span>
          </div>
          {n.observations.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">
              The field hasn't reported yet. Drivers generate observations on every stop.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {n.observations.map((o, i) => (
                <motion.li key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-2 px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{o.building || 'unattributed'}</p>
                    <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                      {o.kind || 'observation'}{o.at && ` · ${new Date(o.at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums ring-1 ${confTone(o.confidence)}`}>
                    {o.confidence != null ? `${Math.round(o.confidence * 100)}%` : 'unscored'}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* CORRECTIONS */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Wrench className="h-4 w-4" /> Corrections
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{n.corrections.length}</span>
        </div>
        {n.corrections.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No corrections yet — nothing has needed fixing.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {n.corrections.map((c, i) => (
              <motion.li key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-2 px-6 py-3">
                <div>
                  <p className="text-sm font-bold text-white">{c.building || 'unattributed'} <span className="text-xs font-semibold text-emerald-100/50">{c.kind || ''}</span></p>
                  {c.at && <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{new Date(c.at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                  ['applied', 'approved', 'completed'].includes(String(c.status)) ? 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30'
                  : 'text-amber-300 bg-amber-400/10 ring-amber-300/30'
                }`}>{String(c.status || 'pending')}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Sparkles className="h-3.5 w-3.5 text-emerald-300" /> Super Admin governs the loop · companies operate on its output
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Eye className="h-3.5 w-3.5" /> Trakbin Intelligence
        </span>
      </motion.footer>
    </div>
  );
}