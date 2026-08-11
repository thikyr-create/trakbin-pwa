"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  LogOut, Building2, Calendar, ArrowRight, CircleCheck, Activity, Radio,
  ShieldCheck, Wallet, Landmark, Zap, Plus, Receipt, Home, History,
  Headphones, TriangleAlert, MapPin, Copy, Check, ExternalLink, Users, Hash, Clock,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

import BillingCard from './components/BillingCard';
import CollectionStatusCard from './components/CollectionStatusCard';
import SupportBanner from './components/SupportBanner';
import StatusTimeline from './components/StatusTimeline';
import ServiceVitalsCard from './components/ServiceVitalsCard';
import BillingStatement from './components/BillingStatement';
import ReportConsole from './components/ReportConsole';
import CheckoutSheet from './payment/components/CheckoutSheet';
import AddBankSheet from './payment/components/AddBankSheet';
import AutopaySheet from './payment/components/AutopaySheet';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type TabId = 'home' | 'records' | 'building' | 'statement' | 'service' | 'report';
type CheckoutIntent = { mode: 'invoice' | 'topup'; invoiceId?: string; amount?: number; description?: string } | null;

function Counter({ value, prefix = '', duration = 1.1 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const unitLabel = (t?: string, n?: number) => {
  const x = (t || 'unit').toLowerCase(); const nn = n ?? 1;
  if (x === 'flats') return nn === 1 ? 'flat' : 'flats';
  if (x === 'shops') return nn === 1 ? 'shop' : 'shops';
  return nn === 1 ? 'unit' : 'units';
};

const block = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.06, ease: EASE } });

const recChip = (s: string) =>
  s === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  : s === 'skipped' ? 'bg-amber-50 text-amber-700 ring-amber-200'
  : s === 'missed' ? 'bg-rose-50 text-rose-700 ring-rose-200'
  : 'bg-gray-100 text-gray-600 ring-gray-200';

function Detail({ Icon, label, value }: { Icon: typeof Users; label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><Icon className="h-3 w-3" /> {label}</p>
      <p className="text-sm font-bold leading-snug text-gray-900">{value}</p>
    </div>
  );
}

export default function CaretakerDashboard() {
  const router = useRouter();
  const {
    building, collectionHistory, billingProcessing, fullHistory, fullHistoryLoaded,
    walletBalance, initializeSession, teardownRealtime, logout, activeAssignment, companyProfile,
  } = useCaretakerSession();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [checkout, setCheckout] = useState<CheckoutIntent>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAutopay, setShowAutopay] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { initializeSession(); return () => teardownRealtime(); }, []);

  // every hook above this guard
  const now = new Date();
  const monthStats = useMemo(() => {
    const rows = fullHistory.filter((it) => { const d = new Date(it.collection_date); return !isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
    const completed = rows.filter((it) => (it.status || 'completed').toLowerCase() === 'completed').length;
    const missed = rows.filter((it) => (it.status || '').toLowerCase() === 'missed').length;
    const total = rows.length;
    const rate = total ? Math.round((completed / total) * 100) : null;
    const weeks = [0, 0, 0, 0, 0];
    rows.forEach((it) => { if ((it.status || 'completed').toLowerCase() !== 'completed') return; const day = new Date(it.collection_date).getDate(); weeks[Math.min(4, Math.floor((day - 1) / 7))]++; });
    return { completed, missed, total, rate, weeks, weekMax: Math.max(1, ...weeks) };
  }, [fullHistory, now.getMonth(), now.getFullYear()]);

  if (!building) return null;
  const isActive = !!activeAssignment && !!companyProfile;
  const address = building.address || 'Unregistered address';
  const assignedCompany = !!building?.company_id;
  const autopayOn = !!building?.autopay_enabled;
  const provider = companyProfile?.business_name || 'your waste provider';
  const needsPay = false; // billing surfaces its own state; no dot needed here
  const needsService = !isActive;

  const lat = building.latitude; const lng = building.longitude;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  const coordStr = hasCoords ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : null;
  const mapsHref = hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;
  const copyCoords = async () => { if (!coordStr) return; try { await navigator.clipboard.writeText(coordStr); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1400); };

  const TABS: { id: TabId; label: string; Icon: typeof Home; dot?: boolean }[] = [
    { id: 'home', label: 'Home', Icon: Home, dot: needsPay },
    { id: 'records', label: 'Records', Icon: History },
    { id: 'building', label: 'Building', Icon: Building2 },
    { id: 'statement', label: 'Statement', Icon: Receipt },
    { id: 'service', label: 'Service', Icon: Headphones, dot: needsService },
    { id: 'report', label: 'Report', Icon: TriangleAlert },
  ];

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-200/40 to-transparent" />
      </div>

      <AnimatePresence>
        {billingProcessing && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.96 }} transition={{ duration: 0.3, ease: EASE }} className="fixed right-4 top-4 z-[1000] flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
            <motion.span className="h-2 w-2 rounded-full bg-white" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            Processing Monthly Billing...
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-40 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200"><span className={`${display.className} text-lg font-extrabold text-white`}>T</span></div>
              <div className="leading-none">
                <span className={`${display.className} block text-lg font-extrabold tracking-tight text-gray-900`}>Trakbin</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">operations</span>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={logout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></motion.button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {activeTab === 'home' && (
              <div className="space-y-4">
                <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-7">
                  <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                  <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-100/50 blur-3xl" />
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
                  <div className="relative z-10 flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600/80">Building console</p>
                        <h1 className={`${display.className} mt-1.5 truncate text-3xl font-extrabold leading-[1.02] tracking-tight text-gray-900 sm:text-[40px]`}>{address}</h1>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          <span className="flex items-center gap-1.5"><Hash className="h-3 w-3" /> {building.custom_id}</span>
                          <span className="text-gray-300">·</span>
                          <span className="normal-case tracking-normal text-gray-400">{building.building_type}</span>
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ${isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                        <span className="relative flex h-2 w-2">{isActive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} /></span>
                        {isActive ? 'Active service' : 'Pending'}
                      </span>
                    </div>
                    <AnimatePresence mode="wait">
                      {isActive ? (
                        <motion.div key="provider" initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                          <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-950 to-emerald-900 p-4 text-white">
                            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 24px)' }} />
                            <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center">
                              <motion.span aria-hidden className="absolute inset-0 rounded-2xl" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} style={{ background: 'conic-gradient(from 0deg, rgba(110,231,183,0.5), transparent 40%)' }} />
                              <span className={`${display.className} relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-black ring-1 ring-white/20 backdrop-blur-sm`}>{(companyProfile?.business_name || '?').charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="relative z-10 min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70"><Headphones className="h-3 w-3" /> Your waste provider</p>
                              <p className={`${display.className} mt-0.5 truncate text-lg font-extrabold leading-tight tracking-tight`}>{companyProfile?.business_name || '—'}</p>
                              <p className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold text-emerald-100/70">
                                <span className="inline-flex items-center gap-1"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" /></span> Online</span>
                                {activeAssignment?.zone_id && <><span className="text-emerald-200/40">·</span> {activeAssignment.zone_id}</>}
                              </p>
                            </div>
                            <button onClick={() => setActiveTab('service')} className="relative z-10 hidden shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold ring-1 ring-white/15 transition-colors hover:bg-white/20 sm:flex">Details <ArrowRight className="h-3 w-3" /></button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="matching" initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                          <div className="flex items-center gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-1 ring-amber-200">
                              <Radio className="relative z-10 h-5 w-5" />
                              <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl bg-amber-300/30" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/70">Matching you with a provider</p>
                              <p className="mt-0.5 text-sm font-bold text-amber-900">Your building is registered and queued</p>
                              <p className="mt-0.5 text-[11px] font-semibold text-amber-700/80">A waste company in your area will activate service shortly — their details land here the moment they do.</p>
                            </div>
                            <button onClick={() => setActiveTab('service')} className="hidden shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200 transition-colors hover:bg-amber-200 sm:flex">Track <ArrowRight className="h-3 w-3" /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.section>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <motion.div {...block(0)} className="group relative overflow-hidden rounded-[22px] border border-emerald-300/40 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-200">
                    <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-50/80"><Wallet className="h-4 w-4" /> Wallet balance</p>
                        <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20"><motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-200" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} /> on‑platform</span>
                      </div>
                      <p className={`${display.className} mt-3 text-4xl font-extrabold tracking-tight tabular-nums`}><Counter value={walletBalance} prefix="₦" /></p>
                      <p className="mt-1 text-xs font-medium text-emerald-50/80">Funds settle invoices automatically when autopay is on</p>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCheckout({ mode: 'topup' })} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-extrabold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add funds</motion.button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddBank(true)} className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"><Landmark className="h-4 w-4" /> Link bank</motion.button>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div {...block(1)}><BillingCard /></motion.div>
                  <motion.div {...block(2)}><CollectionStatusCard /></motion.div>
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-4">
                <motion.div {...block(0)} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-7 shadow-sm sm:p-8">
                  <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <div className="relative z-10 mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-50 p-3"><Calendar className="h-7 w-7 text-emerald-600" /></div><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Collection record</p><h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Last pickup</h3></div></div>
                    <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${collectionHistory.length > 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${collectionHistory.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />{collectionHistory.length > 0 ? 'Up to date' : 'Awaiting first'}</span>
                  </div>
                  <h2 className={`${display.className} relative z-10 mb-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl`}>{collectionHistory.length > 0 ? new Date(collectionHistory[0].collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'No collections yet'}</h2>
                  <p className="relative z-10 mb-6 flex items-center gap-2 text-base font-semibold text-emerald-600"><CircleCheck className="h-5 w-5" /> {collectionHistory.length > 0 ? 'Completed successfully' : 'Awaiting first pickup'}</p>
                  <div className="relative z-10 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                    <motion.span aria-hidden initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, ease: EASE }} className="absolute inset-y-3 left-0 w-1 origin-top rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="pl-2">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">This month · completed</p>
                        <div className="mt-1 flex flex-wrap items-end gap-3">
                          <span className={`${display.className} text-4xl font-extrabold leading-none tracking-tight tabular-nums text-gray-900`}>{fullHistoryLoaded ? <Counter value={monthStats.completed} /> : <span className="inline-block w-8 animate-pulse text-gray-300">—</span>}</span>
                          {fullHistoryLoaded && monthStats.total > 0 && <span className="mb-1 text-xs font-semibold text-gray-400">of {monthStats.total} logged</span>}
                          {fullHistoryLoaded && monthStats.rate !== null && <span className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ring-1 ${monthStats.missed > 0 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}>{monthStats.missed > 0 && <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-amber-500" />}{monthStats.rate}% on-time</span>}
                        </div>
                        {fullHistoryLoaded && monthStats.total === 0 && <p className="mt-2 text-xs font-medium text-gray-400">No pickups logged this month yet.</p>}
                      </div>
                      <div className="pl-2">
                        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Weeks · {now.toLocaleDateString('en-US', { month: 'short' })}</p>
                        <div className="flex h-12 items-end gap-1.5">
                          {monthStats.weeks.map((c, i) => { const h = fullHistoryLoaded && monthStats.completed > 0 ? Math.max(10, Math.round((c / monthStats.weekMax) * 100)) : 12; return (
                            <div key={i} className="group/w relative flex h-full w-5 flex-col items-center justify-end">
                              <span className="pointer-events-none absolute -top-6 rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white opacity-0 transition-opacity group-hover/w:opacity-100">{c}</span>
                              <motion.span initial={{ height: '12%' }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: EASE }} className={`w-full rounded-md transition-colors ${c > 0 ? 'bg-emerald-500 group-hover/w:bg-emerald-400' : 'bg-gray-200 group-hover/w:bg-gray-300'}`} />
                            </div>
                          ); })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div {...block(1)} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                    <h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Recent pickups</h3>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{collectionHistory.length} total</span>
                  </div>
                  {collectionHistory.length === 0 ? (
                    <div className="px-6 py-12 text-center"><Clock className="mx-auto h-6 w-6 text-gray-300" /><p className="mt-2 text-sm font-bold text-gray-700">No pickups yet</p><p className="mt-1 text-xs text-gray-400">Your collection history will build here over time.</p></div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {collectionHistory.slice(0, 5).map((it, i) => {
                        const s = (it.status || 'completed').toLowerCase();
                        return (
                          <motion.li key={it.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease: EASE }} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${recChip(s)}`}><CircleCheck className="h-4 w-4" /></span>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{new Date(it.collection_date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                <p className="flex items-center gap-1 text-xs font-semibold text-gray-500"><MapPin size={11} /> {it.hauler_name || provider}</p>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${recChip(s)}`}>{it.status || 'Completed'}</span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                  <button onClick={() => router.push('/caretaker-dashboard/collection-history')} className="flex w-full items-center justify-center gap-1 border-t border-gray-100 py-3.5 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-50">View complete history <ArrowRight className="h-4 w-4" /></button>
                </motion.div>
              </div>
            )}

            {activeTab === 'building' && (
              <div className="space-y-4">
                <motion.div {...block(0)} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-7 shadow-sm sm:p-8">
                  <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
                  <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Building ID</p>
                      <h2 className={`${display.className} mt-1 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl`}>{building.custom_id}</h2>
                      <p className="mt-2 text-lg font-semibold text-gray-700">{building.building_type}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${(building.status || '').toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${(building.status || '').toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{(building.status || 'pending').toString()}</span>
                  </div>
                </motion.div>

                <motion.div {...block(1)} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-7">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Detail Icon={MapPin} label="Official address" value={building.address || 'Not provided'} />
                    <Detail Icon={Radio} label="Detected map location" value={building.gps_location_address || 'Not captured'} />
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><MapPin className="h-3 w-3" /> GPS coordinates</p>
                      {hasCoords ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5 ring-1 ring-gray-100">
                          <span className="font-mono text-sm font-bold tabular-nums text-gray-900">{coordStr}</span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={copyCoords} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200 transition-colors hover:text-emerald-600" title="Copy">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</motion.button>
                            <a href={mapsHref!} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200 transition-colors hover:text-emerald-600" title="Open in Maps"><ExternalLink className="h-4 w-4" /></a>
                          </div>
                        </div>
                      ) : <p className="text-sm font-semibold text-gray-400">No coordinates on file</p>}
                    </div>
                    <Detail Icon={Users} label="Occupancy" value={`${building.number_of_units ?? 1} ${unitLabel(building.unit_type, building.number_of_units)}`} />
                    <Detail Icon={Calendar} label="Registered" value={building.created_at ? new Date(building.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                    <Detail Icon={ShieldCheck} label="Service" value={isActive ? `Active · ${provider}` : 'Awaiting activation'} />
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'statement' && (
              <div className="space-y-4">
                <motion.div {...block(0)}><BillingStatement /></motion.div>
              </div>
            )}

            {activeTab === 'service' && (
              <div className="space-y-4">
                <motion.div {...block(0)}><SupportBanner /></motion.div>
                {!isActive && <motion.div {...block(1)}><StatusTimeline /></motion.div>}
                <motion.div {...block(isActive ? 1 : 2)}><ServiceVitalsCard /></motion.div>
              </div>
            )}

                        {activeTab === 'report' && (assignedCompany ? (
              <ReportConsole />
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-amber-200/70 bg-amber-50/60 p-8 text-center">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-1 ring-amber-200"><ShieldCheck className="h-7 w-7" /></div>
                <h3 className={`${display.className} relative mt-4 text-xl font-extrabold tracking-tight text-gray-900`}>No waste company assigned yet</h3>
                <p className="relative mx-auto mt-2 max-w-sm text-sm font-medium text-gray-600">You'll be able to report illegal dumping and missed collections as soon as a waste company activates your building.</p>
              </motion.div>
            ))}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* bottom navigation dock */}
      <nav aria-label="Primary" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
        <div className="pointer-events-auto w-full rounded-t-3xl border border-gray-200/80 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_-12px_rgba(16,24,40,0.22)] backdrop-blur-xl lg:mb-4 lg:w-auto lg:min-w-[440px] lg:rounded-3xl lg:px-3 lg:shadow-[0_24px_60px_-18px_rgba(16,24,40,0.3)]">
          <div className="flex items-stretch justify-between gap-1">
            {TABS.map((t) => {
              const Icon = t.Icon;
              const active = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} aria-current={active ? 'page' : undefined} className="group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 lg:min-w-[68px]">
                  {active && <motion.span layoutId="ctabpill" className="absolute inset-0 rounded-2xl bg-emerald-50 ring-1 ring-emerald-100" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <span className="relative">
                    <Icon size={21} strokeWidth={active ? 2.4 : 2} className={`transition-colors ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    {t.dot && <span className="absolute -right-1.5 -top-1 flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" /></span>}
                  </span>
                  <span className={`relative font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-colors ${active ? 'text-emerald-700' : 'text-gray-400 group-hover:text-gray-600'}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* inline sheets */}
      <CheckoutSheet open={!!checkout} mode={checkout?.mode ?? 'topup'} invoiceId={checkout?.invoiceId} amount={checkout?.amount} description={checkout?.description} onClose={() => setCheckout(null)} onLinkBank={() => { setCheckout(null); setShowAddBank(true); }} />
      <AddBankSheet open={showAddBank} onClose={() => setShowAddBank(false)} />
      <AutopaySheet open={showAutopay} onClose={() => setShowAutopay(false)} onLinkBank={() => { setShowAutopay(false); setShowAddBank(true); }} />
    </div>
  );
}