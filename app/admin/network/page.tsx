// app/admin/network/page.tsx
"use client";

import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  MapPin, Network, TriangleAlert, Building2, Users, Layers, Radio,
} from 'lucide-react';
import { useNetwork } from '@/lib/super-admin/hooks/useNetwork';
import type { NetworkPoint } from '@/lib/super-admin/services/network.service';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function pointColor(p: NetworkPoint): string {
  if (p.operatorId == null) return '#fb7185';      // no operator
  if (p.paid) return '#34d399';                    // paying
  if (p.status === 'active') return '#fbbf24';     // active, unpaid
  return 'rgba(255,255,255,0.35)';                 // pending
}

function NetworkMap({ points }: { points: NetworkPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <MapPin className="mx-auto h-8 w-8 text-emerald-300/40" />
        <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>No mapped properties yet</p>
        <p className="mt-1 text-sm font-medium text-emerald-100/50">The spatial matrix renders as soon as buildings carry coordinates.</p>
      </div>
    );
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const W = 640, H = 360, P = 20;
  const x = (lng: number) => P + ((lng - minLng) / Math.max(1e-9, maxLng - minLng)) * (W - 2 * P);
  const y = (lat: number) => H - P - ((lat - minLat) / Math.max(1e-9, maxLat - minLat)) * (H - 2 * P);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full sm:h-80">
      {/* graticule */}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={`v${i}`} x1={(W / 7) * (i + 0.5)} y1={0} x2={(W / 7) * (i + 0.5)} y2={H} stroke="rgba(16,185,129,0.08)" strokeWidth="1" />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={(H / 4) * (i + 0.5)} x2={W} y2={(H / 4) * (i + 0.5)} stroke="rgba(16,185,129,0.08)" strokeWidth="1" />
      ))}
      {points.map((p, i) => (
        <motion.circle key={p.id} cx={x(p.lng)} cy={y(p.lat)} r="4" fill={pointColor(p)}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.9 }}
          transition={{ delay: 0.2 + i * 0.02, ease: EASE }} stroke="rgba(0,0,0,0.4)" strokeWidth="1">
          <title>{`${p.id} · ${p.operator} · ${p.status}${p.paid ? ' · paid' : ''}`}</title>
        </motion.circle>
      ))}
    </svg>
  );
}

export default function AdminNetworkPage() {
  const { network: n, loading } = useNetwork();

  if (loading || !n) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const gaps = n.estates.filter((e) => e.unassigned > 0);
  const coveragePct = n.properties ? Math.round((n.mapped / n.properties) * 100) : 0;

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
              Network · where Trakbin is deployed
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Spatial node matrix</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Observe and govern the network. Dispatch stays inside company dashboards.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Properties</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-white`}>{n.properties}</p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Mapped</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-emerald-300`}>{coveragePct}%</p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Zones</p>
              <p className={`${display.className} mt-1 text-3xl font-black text-white`}>{n.zones}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MAP + COVERAGE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-6 py-4">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
              <Network className="h-4 w-4" /> Network map
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#34d399]" /> paying</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#fbbf24]" /> active unpaid</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#fb7185]" /> no operator</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/40" /> pending</span>
            </div>
          </div>
          <div className="p-4">
            <NetworkMap points={n.points} />
          </div>
        </motion.section>

        {/* COVERAGE GAPS */}
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <TriangleAlert className="h-4 w-4" /> Coverage gaps
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <p className={`${display.className} text-2xl font-black text-white`}>{n.unassigned}</p>
              <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>properties without operator</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <p className={`${display.className} text-2xl font-black text-white`}>{n.properties - n.mapped}</p>
              <p className={`${mono.className} mt-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100/50`}>properties unmapped</p>
            </div>
          </div>
          <p className={`${mono.className} mb-2 mt-5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>Areas needing operators</p>
          {gaps.length === 0 ? (
            <p className="text-sm font-semibold text-emerald-100/50">Every estate has an operator.</p>
          ) : (
            <ul className="space-y-2">
              {gaps.slice(0, 5).map((g) => (
                <li key={g.name} className="flex items-center justify-between rounded-lg bg-rose-400/5 px-3 py-2 ring-1 ring-rose-300/20">
                  <span className="text-xs font-bold text-white">{g.name}</span>
                  <span className={`${mono.className} text-[10px] font-bold text-rose-300`}>{g.unassigned} open</span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {/* OPERATORS BY ESTATE */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Layers className="h-4 w-4" /> Operators by estate
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{n.estates.length} estates</span>
        </div>
        {n.estates.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No properties on the platform yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {n.estates.map((e, i) => (
              <motion.li key={e.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><Building2 className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-extrabold text-white">{e.name}</p>
                    <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                      {e.properties} properties · {e.mapped} mapped
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {e.operators.map((op) => (
                    <span key={op} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      op === 'Unassigned' ? 'bg-rose-400/10 text-rose-300 ring-rose-300/30' : 'bg-emerald-400/10 text-emerald-300 ring-emerald-300/30'
                    }`}>
                      <Users className="h-3 w-3" /> {op}
                    </span>
                  ))}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* ZONES */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Radio className="h-4 w-4" /> Company zones
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{n.zones}</span>
        </div>
        {n.zonesRaw.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">No zones defined yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {n.zonesRaw.slice(0, 20).map((z: any, i) => {
              const name = z.name ?? z.zone_name ?? z.title ?? `Zone #${z.id}`;
              const at = z.created_at ?? null;
              return (
                <motion.li key={String(z.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <p className="text-sm font-extrabold text-white">{String(name)}</p>
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                    {z.company_id != null ? `operator #${z.company_id}` : ''}{at && ` · ${new Date(at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}`}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <MapPin className="h-3.5 w-3.5 text-emerald-300" /> Super Admin observes and governs · companies operate
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Network className="h-3.5 w-3.5" /> Trakbin Network
        </span>
      </motion.footer>
    </div>
  );
}