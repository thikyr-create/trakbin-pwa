"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  ArrowLeft, LogOut, Truck, CalendarClock, Clock, Calendar,
  CheckCircle2, AlertCircle, XCircle, MapPin, Radio, ShieldCheck,
  Activity, Signal,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { parseDays, nextPickupFromDays, formatWindow, zoneLabel } from '@/lib/utils/schedule';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const WEEK = [
  { key: 'sunday', short: 'Su' }, { key: 'monday', short: 'Mo' }, { key: 'tuesday', short: 'Tu' },
  { key: 'wednesday', short: 'We' }, { key: 'thursday', short: 'Th' }, { key: 'friday', short: 'Fr' },
  { key: 'saturday', short: 'Sa' },
] as const;

const todayKey = () => WEEK[new Date().getDay()].key;

type StatusKey = 'live' | 'today' | 'pending' | 'delayed' | 'missed' | 'idle';
const STATUS: Record<StatusKey, { label: string; chip: string; dot: string; Icon: typeof CheckCircle2 }> = {
  live:    { label: 'On schedule',     chip: 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30', dot: 'bg-emerald-300', Icon: CheckCircle2 },
  today:   { label: 'Due today',       chip: 'bg-sky-400/15 text-sky-100 ring-sky-300/30',             dot: 'bg-sky-300',     Icon: Clock },
  pending: { label: 'Schedule pending',chip: 'bg-amber-400/15 text-amber-100 ring-amber-300/30',       dot: 'bg-amber-300',   Icon: Radio },
  delayed: { label: 'Delayed',         chip: 'bg-orange-400/15 text-orange-100 ring-orange-300/30',    dot: 'bg-orange-300',  Icon: AlertCircle },
  missed:  { label: 'Missed',          chip: 'bg-rose-400/15 text-rose-100 ring-rose-300/30',          dot: 'bg-rose-300',    Icon: XCircle },
  idle:    { label: 'Awaiting service',chip: 'bg-white/10 text-emerald-100/70 ring-white/15',          dot: 'bg-white/40',    Icon: Radio },
};

const rowHist: Record<string, { cls: string; Icon: typeof CheckCircle2 }> = {
  completed: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CheckCircle2 },
  skipped:   { cls: 'bg-amber-50 text-amber-700 ring-amber-200',       Icon: AlertCircle },
  missed:    { cls: 'bg-rose-50 text-rose-700 ring-rose-200',          Icon: XCircle },
};

const factGrid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const factCell: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } } };
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const row: Variants = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } } };

export default function CollectionPage() {
  const router = useRouter();
  const {
    building, schedule, activeAssignment, companyProfile, collectionHistory,
    loading, initializeSession, teardownRealtime, logout,
  } = useCaretakerSession();

  // One engine, one subscription — the page inherits live updates from the store.
  useEffect(() => {
    initializeSession();
    return () => teardownRealtime();
  }, []);

  const days = useMemo(() => parseDays(activeAssignment?.pickup_days ?? schedule?.pickup_day), [activeAssignment?.pickup_days, schedule?.pickup_day]);
  const next = useMemo(() => nextPickupFromDays(days), [days.join(',')]);
  const frequency = activeAssignment?.schedule_template || schedule?.frequency || null;
  const window_ = formatWindow(activeAssignment?.time_window ?? schedule?.time_window);
  const zone = zoneLabel(activeAssignment?.zone_id);
  const isActive = !!activeAssignment && !!companyProfile;
  const providerName = companyProfile?.business_name || null;
  const tk = todayKey();
  const daySet = useMemo(() => new Set(days.map((d) => d.toLowerCase())), [days.join(',')]);

  // Real status — honor a written schedule.status if a future engine sets it,
  // otherwise derive from the live relationship. Never a constant.
  const statusKey: StatusKey = (() => {
    const written = schedule?.status;
    if (written === 'delayed') return 'delayed';
    if (written === 'missed') return 'missed';
    if (!isActive) return 'idle';
    if (days.length === 0) return 'pending';
    if (next?.inDays === 0) return 'today';
    return 'live';
  })();
  const status = STATUS[statusKey];
  const StatusIcon = status.Icon;

  const facts = [
    { Icon: CalendarClock, label: 'Frequency', value: frequency || 'Not set' },
    { Icon: Clock, label: 'Time window', value: window_ },
    { Icon: Signal, label: 'Pickups / week', value: days.length ? String(days.length) : '—' },
    { Icon: ShieldCheck, label: 'Service', value: isActive ? 'Active' : 'Pending' },
  ];

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
      </div>

      {/* header — continuous with the dashboard */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => router.push('/caretaker-dashboard')} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-emerald-50 hover:text-emerald-600"><ArrowLeft size={20} /></motion.button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200"><span className={`${display.className} text-lg font-extrabold text-white`}>T</span></div>
              <div className="leading-none">
                <span className={`${display.className} block text-lg font-extrabold tracking-tight text-gray-900`}>Trakbin</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">collections</span>
              </div>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={logout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></motion.button>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* identity strip — opens on the building, not a generic title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80">Collection console</p>
            <h1 className={`${display.className} mt-1 truncate text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl`}>
              {building?.address || 'Your building'}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-500">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-400">{building?.custom_id}</span>
              {zone && <span className="text-gray-400">· {zone}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-gray-200">
            <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">{loading ? 'syncing' : 'session live'}</span>
          </div>
        </motion.div>

        {/* HERO = the next pickup, as the boldest surface (dark emerald console) */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative mb-8 overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70">Next pickup</p>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${status.chip}`}>
                <span className="relative flex h-2 w-2">
                  {(statusKey === 'live' || statusKey === 'today') && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'currentColor' }} />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${status.dot}`} />
                </span>
                <StatusIcon className="h-3.5 w-3.5" /> {status.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
              <h2 className={`${display.className} text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl`}>
                {next ? next.label : 'Not scheduled'}
              </h2>
              {next && (
                <motion.span className="mb-2 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 ring-1 ring-white/10" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }}>
                  <Clock className="h-3.5 w-3.5 text-emerald-200" />
                  <span className="font-mono text-xs font-bold text-emerald-50">
                    {next.inDays === 0 ? 'window open today' : `in ${next.inDays} day${next.inDays === 1 ? '' : 's'}`}
                  </span>
                </motion.span>
              )}
            </div>

            <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-emerald-100/90">
              <Clock className="h-5 w-5 text-emerald-300" /> {window_}
            </p>

            {/* the week rhythm — your real pickup days, visualized */}
            <div className="mt-7">
              <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/60">Weekly rhythm</p>
              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {WEEK.map((d, i) => {
                  const on = daySet.has(d.key);
                  const isToday = d.key === tk;
                  return (
                    <motion.div
                      key={d.key}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.2 + i * 0.05, type: 'spring', stiffness: 280, damping: 18 }}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl ring-1 transition-colors ${
                        on
                          ? 'bg-emerald-500 text-white ring-emerald-300/40 shadow-lg shadow-emerald-900/40'
                          : 'bg-white/5 text-emerald-100/35 ring-white/10'
                      } ${isToday ? 'ring-2 ring-offset-2 ring-offset-emerald-950 ' + (on ? 'ring-white' : 'ring-emerald-300/60') : ''}`}
                    >
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{d.short}</span>
                      {on && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/90" />}
                      {isToday && !on && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300/70" />}
                    </motion.div>
                  );
                })}
              </div>
              {days.length === 0 && (
                <p className="mt-3 text-xs font-medium text-emerald-200/60">No recurring days set yet — your schedule appears here the moment your provider activates service.</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* derived facts — honest, zero-state aware, staggered */}
        <motion.div variants={factGrid} initial="hidden" animate="show" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {facts.map((f) => {
            const Icon = f.Icon;
            const empty = !f.value || f.value === '—' || f.value === 'Not set';
            return (
              <motion.div key={f.label} variants={factCell} whileHover={{ y: -2 }} className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Icon className="h-4 w-4" strokeWidth={2.25} /></span>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{f.label}</p>
                <p className={`mt-0.5 text-base font-black leading-tight tracking-tight ${empty ? 'text-gray-300' : 'text-gray-900'}`}>{f.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* history — a drawing timeline, not a flat list */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
            <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Calendar className="h-4 w-4" /></span>
              Collection history
            </h2>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {String(collectionHistory.length).padStart(2, '0')} logged
            </span>
          </div>

          {collectionHistory.length === 0 ? (
            <div className="relative px-6 py-16 text-center sm:px-8">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
                <Truck className="h-7 w-7 text-gray-300" />
              </div>
              <p className="relative mt-4 text-sm font-bold text-gray-700">No pickups on record yet</p>
              <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Your first completed collection will draw itself into this timeline the moment it&rsquo;s logged by your hauler.</p>
            </div>
          ) : (
            <motion.ol variants={list} initial="hidden" animate="show" className="relative px-6 py-6 sm:px-8">
              <span aria-hidden className="absolute bottom-8 left-[42px] top-8 w-px bg-gray-100 sm:left-[50px]" />
              {collectionHistory.map((item, index) => {
                const st = (item.status || 'completed').toLowerCase();
                const meta = rowHist[st] || rowHist.completed;
                const HistIcon = meta.Icon;
                const isLatest = index === 0;
                const hauler = item.hauler_name || providerName || 'Your hauler';
                return (
                  <motion.li key={item.id || index} variants={row} className="relative flex items-center gap-4 py-3">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + index * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-white sm:h-11 sm:w-11 ${isLatest ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-emerald-600 ring-1 ring-gray-100'}`}
                    >
                      <HistIcon className={isLatest ? 'h-4 w-4' : 'h-4 w-4'} strokeWidth={2.5} />
                    </motion.span>
                    <div className="min-w-0 flex-1 rounded-2xl border border-transparent px-3 py-2 transition-colors hover:border-gray-100 hover:bg-gray-50/70">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(item.collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          {isLatest && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">latest</span>}
                        </p>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${meta.cls}`}>{item.status || 'Completed'}</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <MapPin size={12} className="text-gray-400" /> {hauler}
                        {item.notes && <span className="text-gray-400">· {item.notes}</span>}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ol>
          )}
        </motion.section>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
            <motion.span className="h-2 w-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            Synced to live schedule <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">· auto-refresh on</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin Collections</span>
        </motion.footer>
      </main>
    </div>
  );
}