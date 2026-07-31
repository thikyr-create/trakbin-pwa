"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  ArrowLeft, LogOut, Building2, MapPin, CalendarClock, Clock, Users,
  CreditCard, Truck, Radio, ShieldCheck, Check, Copy, ExternalLink,
  Activity, Signal, Hash,
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

// Deterministic barcode struck from the ID — a "registered specimen" motif.
function barcodeSegments(id: string): { w: number; on: boolean }[] {
  const segs: { w: number; on: boolean }[] = [];
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    segs.push({ w: (c % 3) + 1, on: true });
    segs.push({ w: ((c >> 1) % 2) + 1, on: false });
  }
  return segs;
}

function unitLabel(type: string | undefined, n: number): string {
  const t = (type || 'unit').toLowerCase();
  if (t === 'unit') return n === 1 ? 'unit' : 'units';
  if (t === 'flats') return n === 1 ? 'flat' : 'flats';
  if (t === 'shops') return n === 1 ? 'shop' : 'shops';
  return t;
}

function ageLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const n = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (n <= 0) return 'registered today';
  if (n === 1) return 'registered yesterday';
  if (n < 7) return `registered ${n} days ago`;
  if (n < 30) return `registered ${Math.floor(n / 7)} wk ago`;
  if (n < 365) return `registered ${Math.floor(n / 30)} mo ago`;
  return `registered ${Math.floor(n / 365)} yr ago`;
}

const reveal: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };
const factGrid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const factCell: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } } };

export default function BuildingPage() {
  const router = useRouter();
  const {
    building, schedule, activeAssignment, companyProfile, invoiceCount, walletBalance,
    loading, initializeSession, teardownRealtime, logout,
  } = useCaretakerSession();
  const [copied, setCopied] = useState(false);

  // One engine — identity + live subscription from the store; nothing local.
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
  const bars = useMemo(() => barcodeSegments(building?.custom_id || ''), [building?.custom_id]);

  const lat = building?.latitude;
  const lng = building?.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  const coordStr = hasCoords ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : null;
  const mapsHref = hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;

  const units = building?.number_of_units ?? 1;
  const age = ageLabel(building?.created_at);

  const paidUp = building?.payment_status === 'paid';
  const dueCount = invoiceCount.due;

  const copyCoords = async () => {
    if (!coordStr) return;
    try { await navigator.clipboard.writeText(coordStr); }
    catch { /* clipboard blocked — fail silently, the value is still visible */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (!building) return null; // shell paints from the synchronous store row; no spinner wall

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-200/40 to-transparent" />
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
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">registry</span>
              </div>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={logout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></motion.button>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* identity strip — opens on the place, not a generic title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80"><Hash className="h-3.5 w-3.5" /> {building.custom_id}</p>
            <h1 className={`${display.className} mt-1 text-3xl font-extrabold leading-[1.02] tracking-tight text-gray-900 sm:text-[40px]`}>
              {building.address || 'Unregistered address'}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-500">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-400" /> {building.building_type}</span>
              {age && <span className="text-gray-400">· {age}</span>}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <span className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ${isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
              <span className="relative flex h-2 w-2">{isActive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} /></span>
              {isActive ? <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Active service</span> : <span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" /> Awaiting activation</span>}
            </span>
            <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-gray-200">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">{loading ? 'syncing' : 'live'}</span>
            </div>
          </div>
        </motion.div>

        {/* SPECIMEN PLATE — the building as a registered object */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative mb-8 overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70">Registered specimen</p>
                <h2 className={`${display.className} mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl`}>{building.custom_id}</h2>
                <p className="mt-2 text-base font-semibold text-emerald-100/90">{building.building_type} · {units} {unitLabel(building.unit_type, units)}</p>
              </div>
              {hasCoords && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/30">
                  <MapPin className="h-3.5 w-3.5" /> GPS verified
                </span>
              )}
            </div>

            {/* barcode */}
            <div className="mt-5 flex h-9 items-stretch gap-[2px] opacity-90" aria-hidden>
              {bars.map((b, i) => (
                <motion.span
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.012, ease: EASE }}
                  className="origin-top rounded-[1px]"
                  style={{ width: `${b.w * 2}px`, background: b.on ? 'rgba(255,255,255,0.78)' : 'transparent' }}
                />
              ))}
            </div>

            {/* coordinate plate — real copy + real maps link */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60"><MapPin className="h-3.5 w-3.5" /> Coordinates</p>
                {hasCoords ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-bold tabular-nums text-white">{coordStr}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={copyCoords} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-emerald-100 ring-1 ring-white/10 transition-colors hover:bg-white/20" title="Copy coordinates">
                        {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                      </motion.button>
                      <a href={mapsHref!} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-emerald-100 ring-1 ring-white/10 transition-colors hover:bg-white/20" title="Open in Maps">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-emerald-200/50">No coordinates on file</span>
                )}
                {copied && <p className="mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">copied to clipboard</p>}
              </div>

              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60"><Users className="h-3.5 w-3.5" /> Occupancy</p>
                <p className="text-sm font-bold text-white">
                  <span className="text-2xl font-black tabular-nums">{units}</span> <span className="text-emerald-100/80">{unitLabel(building.unit_type, units)}</span>
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* BENTO — wide next-pickup tile (with week rhythm) + 2x2 facts */}
        <motion.div variants={factGrid} initial="hidden" animate="show" className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* featured: next pickup */}
          <motion.div variants={factCell} whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-50 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/80"><CalendarClock className="h-4 w-4" /> Next pickup</p>
                {next && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                    {next.inDays === 0 ? 'today' : `in ${next.inDays}d`}
                  </span>
                )}
              </div>
              <h3 className={`${display.className} mt-2 text-3xl font-extrabold tracking-tight text-gray-900`}>{next ? next.label : 'Not scheduled'}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-500"><Clock className="h-4 w-4 text-gray-400" /> {window_}</p>

              {/* week rhythm */}
              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {WEEK.map((d, i) => {
                  const on = daySet.has(d.key);
                  const isToday = d.key === tk;
                  return (
                    <motion.div
                      key={d.key}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + i * 0.04, type: 'spring', stiffness: 280, damping: 18 }}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl ring-1 ${on ? 'bg-emerald-600 text-white ring-emerald-300/40 shadow-md shadow-emerald-200' : 'bg-gray-50 text-gray-300 ring-gray-100'} ${isToday ? 'ring-2 ring-offset-1 ring-offset-white ' + (on ? 'ring-emerald-400' : 'ring-gray-300') : ''}`}
                    >
                      <span className="font-mono text-[9px] font-bold uppercase">{d.short}</span>
                      {on && <span className="mt-0.5 h-1 w-1 rounded-full bg-white/90" />}
                    </motion.div>
                  );
                })}
              </div>
              {days.length === 0 && <p className="mt-3 text-xs font-medium text-gray-400">Recurring days appear here once your provider activates service.</p>}
            </div>
          </motion.div>

          {/* 2x2 facts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Signal, label: 'Frequency', value: frequency || 'Not set' },
              { Icon: MapPin, label: 'Zone', value: zone || 'Unassigned' },
              { Icon: Users, label: 'Units', value: `${units} ${unitLabel(building.unit_type, units)}` },
              { Icon: CalendarClock, label: 'On record', value: `${building.created_at ? new Date(building.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}` },
            ].map((f) => {
              const Icon = f.Icon;
              const empty = !f.value || f.value === 'Not set' || f.value === 'Unassigned' || f.value === '—';
              return (
                <motion.div key={f.label} variants={factCell} whileHover={{ y: -2 }} className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition-colors hover:border-emerald-300">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Icon className="h-4 w-4" strokeWidth={2.25} /></span>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{f.label}</p>
                  <p className={`mt-0.5 text-base font-black leading-tight tracking-tight ${empty ? 'text-gray-300' : 'text-gray-900'}`}>{f.value}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* two-up: schedule posture + payment posture */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* schedule / provider */}
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Truck className="h-5 w-5" /></span>
              <div>
                <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Service & schedule</h3>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">operational posture</p>
              </div>
            </div>
            {isActive ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">{providerName?.charAt(0) || 'C'}</span>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">Serviced by</p>
                    <p className="truncate text-sm font-bold text-gray-900">{providerName}</p>
                  </div>
                </div>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between"><dt className="font-semibold text-gray-500">Frequency</dt><dd className="font-bold text-gray-900">{frequency || '—'}</dd></div>
                  <div className="flex items-center justify-between"><dt className="font-semibold text-gray-500">Window</dt><dd className="font-bold text-gray-900">{window_}</dd></div>
                  <div className="flex items-center justify-between"><dt className="font-semibold text-gray-500">Zone</dt><dd className="font-bold text-gray-900">{zone || '—'}</dd></div>
                </dl>
                <p className="border-t border-gray-100 pt-3 text-xs font-medium text-gray-400">Provider contacts live on your dashboard — one place, always current.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center">
                <Radio className="mx-auto h-6 w-6 text-amber-400" />
                <p className="mt-2 text-sm font-bold text-gray-700">No provider assigned yet</p>
                <p className="mt-1 text-xs text-gray-400">Schedule and zone appear the moment a hauler in your area activates service.</p>
              </div>
            )}
          </motion.div>

          {/* payment posture */}
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><CreditCard className="h-5 w-5" /></span>
              <div>
                <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Payment posture</h3>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400">account standing</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50/70 p-3 ring-1 ring-gray-100">
                <span className="text-sm font-semibold text-gray-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${paidUp ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : dueCount > 0 ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${paidUp ? 'bg-emerald-500' : dueCount > 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                  {paidUp ? 'Up to date' : dueCount > 0 ? `${dueCount} outstanding` : 'Awaiting first bill'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">Wallet balance</span>
                <span className={`${display.className} text-xl font-extrabold tabular-nums text-gray-900`}>₦{(walletBalance ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-500">Invoices</span>
                <span className="font-bold text-gray-900"><span className="text-emerald-600">{invoiceCount.paid}</span> paid · <span className={dueCount > 0 ? 'text-red-600' : 'text-gray-400'}>{dueCount}</span> due</span>
              </div>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push('/caretaker-dashboard/payment')} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700">
                View invoices & pay <ArrowLeft className="h-4 w-4 rotate-180" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
            <motion.span className="h-2 w-2 rounded-full bg-emerald-500" animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            Synced to live registry <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">· auto-refresh on</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin Registry</span>
        </motion.footer>
      </main>
    </div>
  );
}