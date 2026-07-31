"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Truck, ArrowRight, CalendarClock, Clock } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { parseDays, nextPickupFromDays, formatWindow } from '@/lib/utils/schedule';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function CollectionStatusCard() {
  const router = useRouter();
  const { schedule, activeAssignment } = useCaretakerSession();

  const days = parseDays(activeAssignment?.pickup_days ?? schedule?.pickup_day);
  const next = nextPickupFromDays(days);
  const frequency = activeAssignment?.schedule_template || schedule?.frequency || null;
  const window = formatWindow(activeAssignment?.time_window ?? schedule?.time_window);

  const hasSchedule = days.length > 0;
  const status = hasSchedule
    ? { label: 'On schedule', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700' }
    : { label: 'Awaiting schedule', dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => router.push('/caretaker-dashboard/collection')}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 hover:border-emerald-400 hover:shadow-xl"
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="rounded-2xl bg-emerald-50 p-3.5">
          <Truck className="h-7 w-7 text-emerald-600" />
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
        </span>
      </div>

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Next pickup</p>
      <h3 className="mt-1 text-2xl font-black leading-tight tracking-tight text-gray-900">
        {next ? next.label : 'Not scheduled yet'}
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-500">
        <Clock className="h-4 w-4 text-gray-400" /> {window}
      </p>

      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
          <CalendarClock className="h-4 w-4 text-gray-400" /> {frequency || 'No plan set'}
        </span>
        <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
          View schedule
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </motion.div>
  );
}