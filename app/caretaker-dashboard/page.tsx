"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  LogOut, Building2, Calendar, ArrowRight, CheckCircle2,
  Activity, Radio, ShieldCheck,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

import BillingCard from './components/BillingCard';
import WalletCard from './components/WalletCard';
import CollectionStatusCard from './components/CollectionStatusCard';
import ReportIssueCard from './components/ReportIssueCard';
import AddFundsModal from './components/AddFundsModal';
import AutopayModal from './components/AutopayModal';
import SupportBanner from './components/SupportBanner';
import StatusTimeline from './components/StatusTimeline';
import ServiceVitalsCard from './components/ServiceVitalsCard';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });

// Cubic-bezier as an explicit tuple so strict TS / Vercel never infer number[]
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const reveal: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function CaretakerDashboard() {
  const router = useRouter();
  const {
    building, collectionHistory, loading, billingProcessing,
    initializeSession, logout, activeAssignment, companyProfile,
  } = useCaretakerSession();

  useEffect(() => { initializeSession(); }, []);

  if (loading) {
    return (
      <div className={`${body.className} min-h-screen flex items-center justify-center bg-[#f6f7f6]`}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-12 w-12 rounded-full border-b-2 border-emerald-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
            loading console…
          </p>
        </div>
      </div>
    );
  }
  if (!building) return null;

  const isActive = !!activeAssignment && !!companyProfile;
  const address = building.address || 'Unregistered address';

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      {/* ── Ambient field (behind everything) ─────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-200/40 to-transparent" />
      </div>

      {/* ── Billing toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {billingProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed right-4 top-4 z-[1000] flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg"
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            Processing Monthly Billing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200">
                <span className={`${display.className} text-lg font-extrabold text-white`}>T</span>
              </div>
              <div className="leading-none">
                <span className={`${display.className} block text-lg font-extrabold tracking-tight text-gray-900`}>Trakbin</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">operations</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={logout}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ── Identity + live telemetry panel (opens on state, not a hero) ── */}
        <motion.section
          variants={rise}
          initial="hidden"
          animate="show"
          className="relative mb-8 overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8"
        >
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80">
                Building operations console
              </p>
              <h1 className={`${display.className} mt-2 truncate text-3xl font-extrabold leading-[1.05] tracking-tight text-gray-900 sm:text-[40px]`}>
                {address}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-gray-400" /> {building.building_type}
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-gray-400">
                  {building.custom_id}
                </span>
              </p>
            </div>

            {/* live telemetry cluster */}
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <span
                className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-amber-50 text-amber-700 ring-amber-200'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isActive && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Active service
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5" /> Awaiting activation
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3.5 py-2 ring-1 ring-gray-200">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  session live
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Relationship + journey + service vitals ─────────────────── */}
        <SupportBanner />
        <StatusTimeline />
        <ServiceVitalsCard />

        {/* ── Operational cards — staggered cascade ───────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={item}><BillingCard /></motion.div>
          <motion.div variants={item}><WalletCard /></motion.div>
          <motion.div variants={item}><CollectionStatusCard /></motion.div>
          <motion.div variants={item}><ReportIssueCard /></motion.div>
        </motion.div>

        {/* ── Building details — scroll reveal ────────────────────────── */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => router.push('/caretaker-dashboard/building')}
          className="group relative mb-10 cursor-pointer overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-8 shadow-sm transition-colors duration-200 hover:border-emerald-400 hover:shadow-xl"
        >
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3"><Building2 className="h-8 w-8 text-emerald-600" /></div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Building Registry</h3>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-emerald-600" />
          </div>
          <h2 className={`${display.className} mb-2 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl`}>
            {building.custom_id}
          </h2>
          <p className="mb-6 text-lg font-semibold text-gray-700">{building.building_type}</p>
          <div className="my-6 h-px bg-gray-100" />
          <p className="text-sm font-bold text-gray-600">{address}</p>
        </motion.div>

        {/* ── Collection history — scroll reveal ──────────────────────── */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => router.push('/caretaker-dashboard/collection-history')}
          className="group relative mb-10 cursor-pointer overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-8 shadow-sm transition-colors duration-200 hover:border-emerald-400 hover:shadow-xl"
        >
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3"><Calendar className="h-8 w-8 text-emerald-600" /></div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Collection History</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Up to Date
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-gray-500">Last Collection</p>
          <h2 className={`${display.className} mb-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl`}>
            {collectionHistory.length > 0
              ? new Date(collectionHistory[0].collection_date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              : 'No Collections Yet'}
          </h2>
          <p className="mb-6 flex items-center gap-2 text-base font-semibold text-emerald-600">
            <CheckCircle2 className="h-5 w-5" /> {collectionHistory.length > 0 ? 'Completed Successfully' : 'Awaiting First Pickup'}
          </p>
          <div className="my-6 h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">This Month</p>
              <p className="text-lg font-bold text-gray-900">{collectionHistory.length} Collections Completed</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
              <span>View History</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </motion.div>

        {/* ── Platform sync footer ────────────────────────────────────── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
            <motion.span
              className="h-2 w-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Platform synced
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">· live session</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Trakbin Operations
          </span>
        </motion.footer>
      </main>

      <AddFundsModal />
      <AutopayModal />
    </div>
  );
} 