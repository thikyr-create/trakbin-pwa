"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate, useMotionValue, useTransform, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  LogOut, Building2, Calendar, ArrowRight, CheckCircle2, Activity, Radio,
  ShieldCheck, Wallet, Landmark, Zap, Plus, Receipt,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

import BillingCard from './components/BillingCard';
import WalletCard from './components/WalletCard';
import CollectionStatusCard from './components/CollectionStatusCard';
import ReportIssueCard from './components/ReportIssueCard';
import SupportBanner from './components/SupportBanner';
import StatusTimeline from './components/StatusTimeline';
import ServiceVitalsCard from './components/ServiceVitalsCard';
import BillingStatement from './components/BillingStatement';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Counter({ value, prefix = '', duration = 1.1 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };
const rise: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };
const reveal: Variants = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

const BILLING = '/caretaker-dashboard/payment';

export default function CaretakerDashboard() {
  const router = useRouter();
  const {
    building, collectionHistory, billingProcessing, fullHistory, fullHistoryLoaded,
    walletBalance, initializeSession, teardownRealtime, logout, activeAssignment, companyProfile,
  } = useCaretakerSession();

  useEffect(() => { initializeSession(); return () => teardownRealtime(); }, []);

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
  const autopayOn = !!building?.autopay_enabled;

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
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

      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.section variants={rise} initial="hidden" animate="show" className="relative mb-8 overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80">Building operations console</p>
              <h1 className={`${display.className} mt-2 truncate text-3xl font-extrabold leading-[1.05] tracking-tight text-gray-900 sm:text-[40px]`}>{address}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-500">
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-400" /> {building.building_type}</span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-400">{building.custom_id}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <span className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ${isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                <span className="relative flex h-2 w-2">{isActive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} /></span>
                {isActive ? <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Active service</span> : <span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" /> Awaiting activation</span>}
              </span>
              <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3.5 py-2 ring-1 ring-gray-200">
                <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">session live</span>
              </div>
            </div>
          </div>
        </motion.section>

        <SupportBanner />

        <AnimatePresence>
          {!isActive && (
            <motion.div key="journey" exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
              <StatusTimeline />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={container} initial="hidden" animate="show" className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={item}><BillingCard /></motion.div>
          <motion.div variants={item}><WalletCard /></motion.div>
          <motion.div variants={item}><CollectionStatusCard /></motion.div>
          <motion.div variants={item}><ReportIssueCard /></motion.div>
        </motion.div>

        <ServiceVitalsCard />

        {/* wallet + autopay — both route into the self-contained billing feature */}
        <div className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[22px] border border-emerald-300/40 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-200">
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-50/80"><Wallet className="h-4 w-4" /> Wallet balance</p>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20">on‑platform</span>
              </div>
              <p className={`${display.className} mt-3 text-4xl font-extrabold tracking-tight tabular-nums`}><Counter value={walletBalance} prefix="₦" /></p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(BILLING)} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-extrabold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add funds</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(BILLING)} className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"><Landmark className="h-4 w-4" /> Link bank</motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/80"><Zap className="h-4 w-4" /> Autopay</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${autopayOn ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${autopayOn ? 'bg-emerald-500' : 'bg-gray-400'}`} /> {autopayOn ? 'Active' : 'Off'}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">{autopayOn ? 'Every invoice settles itself from your wallet on the 1st — no overdue, no reminders.' : 'Turn on autopay and every invoice settles itself the moment it’s due.'}</p>
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push(BILLING)} className="mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100">{autopayOn ? 'Manage autopay' : 'Enable autopay'}</motion.button>
          </motion.div>
        </div>

        <BillingStatement />

        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} whileHover={{ y: -4 }} whileTap={{ scale: 0.995 }} onClick={() => router.push('/caretaker-dashboard/building')} className="group relative mb-10 cursor-pointer overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-8 shadow-sm transition-colors duration-200 hover:border-emerald-400 hover:shadow-xl">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-50 p-3"><Building2 className="h-8 w-8 text-emerald-600" /></div><h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Building Registry</h3></div>
            <ArrowRight className="h-5 w-5 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-emerald-600" />
          </div>
          <h2 className={`${display.className} mb-2 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl`}>{building.custom_id}</h2>
          <p className="mb-6 text-lg font-semibold text-gray-700">{building.building_type}</p>
          <div className="my-6 h-px bg-gray-100" />
          <p className="text-sm font-bold text-gray-600">{address}</p>
        </motion.div>

        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} whileHover={{ y: -4 }} whileTap={{ scale: 0.995 }} onClick={() => router.push('/caretaker-dashboard/collection-history')} className="group relative mb-10 cursor-pointer overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-8 shadow-sm transition-colors duration-200 hover:border-emerald-400 hover:shadow-xl">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
          <div className="relative z-10 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3"><div className="rounded-2xl bg-emerald-50 p-3"><Calendar className="h-8 w-8 text-emerald-600" /></div><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Collection record</p><h3 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Last pickup</h3></div></div>
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${collectionHistory.length > 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${collectionHistory.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />{collectionHistory.length > 0 ? 'Up to date' : 'Awaiting first'}</span>
          </div>
          <h2 className={`${display.className} relative z-10 mb-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl`}>{collectionHistory.length > 0 ? new Date(collectionHistory[0].collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'No collections yet'}</h2>
          <p className="relative z-10 mb-6 flex items-center gap-2 text-base font-semibold text-emerald-600"><CheckCircle2 className="h-5 w-5" /> {collectionHistory.length > 0 ? 'Completed successfully' : 'Awaiting first pickup'}</p>
          <div className="relative z-10 my-6 h-px bg-gray-100" />
          <div className="relative z-10 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            <motion.span aria-hidden initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }} className="absolute inset-y-3 left-0 w-1 origin-top rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
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
          <div className="relative z-10 mt-5 flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{collectionHistory.length} recent on record</p>
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">View history <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></span>
          </div>
        </motion.div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500"><Receipt className="h-3.5 w-3.5 text-emerald-500" /> Platform synced <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">· live session</span></span>
          <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin Operations</span>
        </motion.footer>
      </main>
    </div>
  );
}