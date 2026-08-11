"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, animate, useMotionValue, useTransform, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  ArrowLeft, LogOut, Calendar, CircleCheck, CircleAlert, CircleX,
  MapPin, Flame, TrendingUp, Clock, ShieldCheck, Activity, Truck, History,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const rowMeta: Record<string, { cls: string; Icon: typeof CircleCheck; label: string }> = {
  completed: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CircleCheck, label: 'Completed' },
  skipped:   { cls: 'bg-amber-50 text-amber-700 ring-amber-200',       Icon: CircleAlert,  label: 'Skipped' },
  missed:    { cls: 'bg-rose-50 text-rose-700 ring-rose-200',          Icon: CircleX,      label: 'Missed' },
};
const normStatus = (s?: string) => (s || 'completed').toLowerCase();

function daysAgo(d: Date): string {
  const n = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 7) return `${n} days ago`;
  if (n < 30) return `${Math.floor(n / 7)} wk ago`;
  return `${Math.floor(n / 30)} mo ago`;
}

// Animated integer that re-runs whenever the target changes (so the total
// ticks up live when a new pickup logs via Realtime).
function Counter({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: EASE });
    return () => c.stop();
  }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const row: Variants = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } } };
const reveal: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

export default function CollectionHistoryPage() {
  const router = useRouter();
  const {
    building, fullHistory, fullHistoryLoaded, companyProfile, loading,
    initializeSession, fetchFullHistory, teardownRealtime, logout,
  } = useCaretakerSession();

  // One engine: identity + live subscription come from the store; this page
  // only asks for the uncapped record. No client, no localStorage read.
  useEffect(() => {
    initializeSession();
    fetchFullHistory();
    return () => teardownRealtime();
  }, []);

  const providerName = companyProfile?.business_name || null;
  const syncing = !fullHistoryLoaded;

  const stats = useMemo(() => {
    const total = fullHistory.length;
    let completed = 0, missed = 0, skipped = 0;
    fullHistory.forEach((it) => {
      const s = normStatus(it.status);
      if (s === 'missed') missed++;
      else if (s === 'skipped') skipped++;
      else completed++;
    });
    const rate = total ? Math.round((completed / total) * 100) : null;
    let streak = 0;
    for (const it of fullHistory) { if (normStatus(it.status) === 'completed') streak++; else break; }
    const last = fullHistory[0] ? new Date(fullHistory[0].collection_date) : null;
    return { total, completed, missed, skipped, rate, streak, last };
  }, [fullHistory]);

  // 12-month activity series derived from the record (completed pickups only).
  const activity = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS_SHORT[d.getMonth()], count: 0 };
    });
    const idx = new Map(buckets.map((b) => [b.key, b]));
    fullHistory.forEach((it) => {
      const dt = new Date(it.collection_date);
      if (isNaN(dt.getTime()) || normStatus(it.status) !== 'completed') return;
      const b = idx.get(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
      if (b) b.count++;
    });
    return buckets;
  }, [fullHistory]);
  const maxBar = Math.max(1, ...activity.map((a) => a.count));
  const anyActivity = activity.some((a) => a.count > 0);

  // Month-grouped ledger (input is already newest-first).
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: any[] }>();
    fullHistory.forEach((it) => {
      const dt = new Date(it.collection_date);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { label: dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), items: [] });
      map.get(key)!.items.push(it);
    });
    return Array.from(map.entries());
  }, [fullHistory]);

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
      </div>

      {/* header */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => router.push('/caretaker-dashboard')} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-emerald-50 hover:text-emerald-600"><ArrowLeft size={20} /></motion.button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200"><span className={`${display.className} text-lg font-extrabold text-white`}>T</span></div>
              <div className="leading-none">
                <span className={`${display.className} block text-lg font-extrabold tracking-tight text-gray-900`}>Trakbin</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">history</span>
              </div>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={logout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></motion.button>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* identity strip */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80"><History className="h-3.5 w-3.5" /> Collection record</p>
            <h1 className={`${display.className} mt-1 truncate text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl`}>{building?.address || 'Your building'}</h1>
            <p className="mt-1 font-mono text-xs font-bold uppercase tracking-wider text-gray-400">{building?.custom_id}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-gray-200">
            <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">{syncing ? 'syncing record' : 'session live'}</span>
          </div>
        </motion.div>

        {/* RELIABILITY BAND — the emotional core of a history page */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative mb-8 overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            {/* left: the headline metric + reliability vitals */}
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70">Pickups logged</p>
              <div className="mt-1 flex items-end gap-3">
                <span className={`${display.className} text-6xl font-extrabold leading-[0.9] tracking-tight tabular-nums sm:text-7xl`}>
                  <Counter value={stats.total} />
                </span>
                {stats.streak > 0 && (
                  <motion.span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-300/30" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
                    <Flame className="h-3.5 w-3.5" /> {stats.streak} on-time
                  </motion.span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <p className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200/60"><TrendingUp className="h-3 w-3" /> On-time</p>
                  <p className="mt-1 text-xl font-black tabular-nums">{stats.rate === null ? '—' : `${stats.rate}%`}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <p className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200/60"><Clock className="h-3 w-3" /> Last</p>
                  <p className="mt-1 truncate text-xl font-black">{stats.last ? daysAgo(stats.last) : '—'}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <p className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200/60"><ShieldCheck className="h-3 w-3" /> Missed</p>
                  <p className="mt-1 text-xl font-black tabular-nums">{stats.missed}</p>
                </div>
              </div>

              {providerName && (
                <p className="mt-4 text-xs font-medium text-emerald-200/70">Serviced by <span className="font-bold text-emerald-100">{providerName}</span></p>
              )}
            </div>

            {/* right: 12-month activity chart, derived from the record */}
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60"><Activity className="h-3.5 w-3.5" /> Activity · 12 mo</p>
                {!anyActivity && <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-200/40">no data yet</span>}
              </div>
              <div className="flex h-28 items-end gap-1.5 sm:gap-2">
                {activity.map((m, i) => {
                  const h = anyActivity ? Math.max(4, Math.round((m.count / maxBar) * 100)) : 4;
                  const isCurrent = i === activity.length - 1;
                  return (
                    <div key={m.key} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <span className="pointer-events-none absolute -top-7 rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-950 opacity-0 shadow transition-opacity group-hover:opacity-100">{m.count}</span>
                      <motion.div
                        initial={{ height: 4 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 0.25 + i * 0.04, ease: EASE }}
                        className={`w-full rounded-md ${m.count > 0 ? (isCurrent ? 'bg-emerald-300' : 'bg-emerald-500/80') : 'bg-white/10'} transition-colors group-hover:bg-emerald-300`}
                      />
                      <span className={`font-mono text-[9px] font-bold ${isCurrent ? 'text-emerald-200' : 'text-emerald-200/40'}`}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        {/* LEDGER — month-grouped, drawing timelines */}
        <section className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
            <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Calendar className="h-4 w-4" /></span>
              Full ledger
            </h2>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2.5 sm:flex">
                {Object.values(rowMeta).map((m) => (
                  <span key={m.label} className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-md ring-1 ${m.cls}`}><m.Icon className="h-2.5 w-2.5" strokeWidth={3} /></span>
                    {m.label}
                  </span>
                ))}
              </div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{String(stats.total).padStart(2, '0')} total</span>
            </div>
          </div>

          {/* syncing skeletons — alive, not a wall */}
          {syncing && stats.total === 0 && (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-5 sm:px-8">
                  <span className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <span className="block h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                    <span className="block h-2.5 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* honest empty state */}
          {!syncing && stats.total === 0 && (
            <div className="relative px-6 py-16 text-center sm:px-8">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Truck className="h-7 w-7 text-gray-300" /></div>
              <p className="relative mt-4 text-sm font-bold text-gray-700">No pickups on record yet</p>
              <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Completed collections draw themselves into this ledger the moment your hauler logs them.</p>
            </div>
          )}

          {/* the record */}
          {!syncing && stats.total > 0 && (
            <div className="divide-y divide-gray-100">
              {groups.map(([key, group]) => {
                const monthCompleted = group.items.filter((it) => normStatus(it.status) !== 'missed').length;
                return (
                  <motion.div key={key} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
                    {/* month header */}
                    <div className="sticky top-16 z-10 flex items-center justify-between bg-gray-50/90 px-6 py-2.5 backdrop-blur-sm sm:px-8">
                      <span className={`${display.className} text-sm font-extrabold tracking-tight text-gray-700`}>{group.label}</span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">{monthCompleted}/{group.items.length} on-time</span>
                    </div>

                    <motion.ol variants={list} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="relative px-6 py-3 sm:px-8">
                      <span aria-hidden className="absolute bottom-6 left-[42px] top-6 w-px bg-gray-100 sm:left-[50px]" />
                      {group.items.map((item, idx) => {
                        const s = normStatus(item.status);
                        const meta = rowMeta[s] || rowMeta.completed;
                        const Icon = meta.Icon;
                        const hauler = item.hauler_name || providerName || 'Your hauler';
                        return (
                          <motion.li key={item.id || `${key}-${idx}`} variants={row} className="group relative flex items-center gap-4 py-3">
                            <motion.span
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.3, delay: idx * 0.05, type: 'spring', stiffness: 260, damping: 18 }}
                              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-white transition-transform group-hover:scale-110 sm:h-11 sm:w-11 ${idx === 0 && key === groups[0][0] ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-emerald-600 ring-1 ring-gray-100'}`}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2.5} />
                            </motion.span>
                            <div className="min-w-0 flex-1 rounded-2xl border border-transparent px-3 py-2 transition-colors group-hover:border-gray-100 group-hover:bg-gray-50/70">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <p className="text-sm font-bold text-gray-900">
                                  {new Date(item.collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${meta.cls}`}>{item.status || 'Completed'}</span>
                              </div>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-400" /> {hauler}</span>
                                {item.weight_kg != null && <span className="text-gray-400">· {item.weight_kg} kg</span>}
                                {item.notes && <span className="truncate text-gray-400">· {item.notes}</span>}
                              </p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </motion.ol>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
            <motion.span className="h-2 w-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            Synced to live record <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">· auto-refresh on</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin History</span>
        </motion.footer>
      </main>
    </div>
  );
}