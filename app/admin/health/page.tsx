// app/admin/health/page.tsx
"use client";

import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Activity, RefreshCw, TriangleAlert, Database, KeyRound, HardDrive,
  Server, Map, Landmark, Mail, Cog, Braces,
} from 'lucide-react';
import { usePlatformHealth } from '@/lib/super-admin/hooks/usePlatformHealth';
import type { ProbeResult } from '@/lib/super-admin/services/health.service';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PROBE_ICON: Record<string, any> = {
  Database, Authentication: KeyRound, Storage: HardDrive, API: Server,
  Mapbox: Map, Paystack: Landmark, Email: Mail, RPC: Braces,
};

function dot(status: ProbeResult['status']) {
  if (status === 'healthy') return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]';
  if (status === 'degraded') return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]';
  if (status === 'down') return 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.8)]';
  return 'bg-white/30';
}

export default function AdminHealthPage() {
  const { probes, jobs, incidents, loading, refresh } = usePlatformHealth();

  const overall = probes.some((p) => p.status === 'down') ? 'down'
    : probes.some((p) => p.status === 'degraded') ? 'degraded' : 'healthy';

  return (
    <div className="space-y-6">
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
              Platform health · technical truth
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>
              {loading ? 'Probing…' : overall === 'healthy' ? 'All systems operational' : overall === 'degraded' ? 'Degraded performance' : 'System failure detected'}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Live probes with real latencies. No truck operations here — this is the control plane's own vitals.
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={refresh}
            className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-emerald-950 hover:bg-emerald-300">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-probe
          </motion.button>
        </div>
      </motion.section>

      {/* STATUS BOARD — every probe real, RPC included */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(loading
          ? ['Database', 'Authentication', 'Storage', 'API', 'RPC', 'Mapbox', 'Paystack', 'Email'].map((name) => ({
              name, status: 'unconfigured' as const, latencyMs: 0, detail: 'probing…',
            }))
          : probes
        ).map((p, i) => {
          const Icon = PROBE_ICON[p.name] || Activity;
          return (
            <motion.section key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease: EASE }}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-extrabold text-white"><Icon className="h-4 w-4 text-emerald-300" /> {p.name}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${dot(p.status)}`} />
              </div>
              <p className={`${mono.className} mt-3 text-lg font-black tabular-nums text-white`}>
                {p.status === 'unconfigured' ? '—' : `${p.latencyMs}ms`}
              </p>
              <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-wider ${
                p.status === 'down' ? 'text-rose-300' : p.status === 'degraded' ? 'text-amber-300' : 'text-emerald-100/50'
              }`}>{p.status} · {p.detail}</p>
            </motion.section>
          );
        })}
      </div>

      {/* BACKGROUND JOBS + INCIDENTS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Cog className="h-4 w-4" /> Background jobs
          </p>
          {!jobs ? <p className="mt-5 text-sm font-semibold text-emerald-100/50">Reading job state…</p> : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Email backlog</p>
                <p className={`${display.className} mt-1 text-2xl font-black ${jobs.emailBacklog > 0 ? 'text-amber-300' : 'text-white'}`}>{jobs.emailBacklog}</p>
                <p className="text-[10px] font-semibold text-emerald-100/40">queued for drain</p>
              </div>
              <div>
                <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Last email delivery</p>
                <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{jobs.lastDeliveryAt ? new Date(jobs.lastDeliveryAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—'}</p>
                <p className="text-[10px] font-semibold text-emerald-100/40">delivery engine</p>
              </div>
              <div>
                <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Last field run</p>
                <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{jobs.lastFieldRunAt ? new Date(jobs.lastFieldRunAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—'}</p>
                <p className="text-[10px] font-semibold text-emerald-100/40">field engine</p>
              </div>
              <div>
                <p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Last dispatch event</p>
                <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{jobs.lastDispatchAt ? new Date(jobs.lastDispatchAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—'}</p>
                <p className="text-[10px] font-semibold text-emerald-100/40">dispatcher</p>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <TriangleAlert className="h-4 w-4" /> Incidents · 7 days
            </p>
            <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{incidents.length}</span>
          </div>
          {incidents.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm font-semibold text-emerald-100/50">No incidents in the last 7 days.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {incidents.map((x, i) => (
                <motion.li key={x.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ease: EASE }}
                  className="flex items-center gap-3 px-6 py-3.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${x.tone === 'rose' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  <span className="text-xs font-bold text-white">{x.label}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Database className="h-3.5 w-3.5 text-emerald-300" /> Probes run from your browser with real latency
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Activity className="h-3.5 w-3.5" /> Trakbin Health
        </span>
      </motion.footer>
    </div>
  );
}