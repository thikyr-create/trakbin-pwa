"use client";

import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Activity, CalendarCheck2, Gauge, Repeat2, Signal } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { parseDays, nextPickupFromDays, zoneLabel } from '@/lib/utils/schedule';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };
const cell: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } } };

export default function ServiceVitalsCard() {
  const { activeAssignment, companyProfile, collectionHistory } = useCaretakerSession();
  const isActive = !!activeAssignment && !!companyProfile;

  const days = useMemo(() => parseDays(activeAssignment?.pickup_days), [activeAssignment?.pickup_days]);
  const next = useMemo(() => nextPickupFromDays(days), [days.join(',')]);
  const zone = zoneLabel(activeAssignment?.zone_id);
  const onRecord = collectionHistory?.length ?? 0;
  const plan = activeAssignment?.schedule_template || 'Standard plan';

  if (!isActive) return null;

  const vitals = [
    { Icon: CalendarCheck2, label: 'Service since', value: fmtDate(activeAssignment?.activated_at), live: false },
    { Icon: Repeat2, label: 'Plan', value: plan, live: false },
    { Icon: Signal, label: 'Next collection', value: next ? next.label : 'As scheduled', sub: next ? (next.inDays === 0 ? 'window open today' : `in ${next.inDays} day${next.inDays === 1 ? '' : 's'}`) : 'days not set', live: true },
    { Icon: Gauge, label: 'Collections on record', value: String(onRecord), sub: onRecord === 1 ? 'pickup logged' : 'pickups logged', live: false },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      whileHover={{ y: -3 }}
      className="group relative mb-8 overflow-hidden rounded-[22px] border border-emerald-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-emerald-900/5 sm:p-7"
    >
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-100/50 blur-3xl" />
      <motion.span aria-hidden initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, delay: 0.15, ease: EASE }} className="absolute inset-y-5 left-0 w-1 origin-top rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80">Service account</p>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            Active{zone ? ` · ${zone}` : ''}
          </span>
        </div>

        <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-gray-900 sm:text-[26px]">Your collection, on the books</h3>
        <p className="mt-1 max-w-md text-sm font-medium text-gray-500">The operational facts of your active service — refreshed live from the database.</p>

        <motion.div variants={grid} initial="hidden" animate="show" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {vitals.map((v) => {
            const Icon = v.Icon;
            return (
              <motion.div key={v.label} variants={cell} whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/40">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-100"><Icon className="h-4 w-4" strokeWidth={2.25} /></span>
                  {v.live && (
                    <motion.span aria-hidden className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-500" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Activity className="h-3 w-3" /> live
                    </motion.span>
                  )}
                </div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{v.label}</p>
                <p className="mt-0.5 text-lg font-black leading-tight tracking-tight text-emerald-700">{v.value}</p>
                {v.sub && <p className="mt-0.5 text-xs font-semibold text-gray-400">{v.sub}</p>}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}