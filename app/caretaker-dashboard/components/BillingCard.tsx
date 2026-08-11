"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, CircleCheck, ArrowRight, CircleAlert } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function BillingCard() {
  const router = useRouter();
  const { building, invoiceCount, loading: sessionLoading, setShowAutopay } = useCaretakerSession();
  const [pending, setPending] = useState<any[] | null>(null);

  useEffect(() => {
    if (!building) return;
    let alive = true;
    supabase
      .from('invoices')
      .select('amount, due_date, status')
      .eq('building_id', building.custom_id)
      .neq('status', 'paid')
      .order('due_date', { ascending: true })
      .then(({ data }) => { if (alive) setPending(data || []); });
    return () => { alive = false; };
  }, [building?.custom_id, invoiceCount.due]);

  if (!building) return null;

  const loaded = pending !== null && !sessionLoading;
  const dueTotal = (pending || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const oldest = (pending || [])[0];
  const isOverdue = oldest ? new Date(oldest.due_date) < new Date(new Date().toDateString()) : false;

  // Honest state machine — never a fake figure.
  let chip: { text: string; cls: string };
  let headline: string;
  let sub: string;
  if (!loaded) {
    chip = { text: 'Syncing', cls: 'bg-gray-100 text-gray-500' };
    headline = '—';
    sub = 'Reading your account…';
  } else if ((pending || []).length > 0) {
    chip = isOverdue
      ? { text: 'Overdue', cls: 'bg-red-50 text-red-700' }
      : { text: 'Outstanding', cls: 'bg-amber-50 text-amber-700' };
    headline = `₦${dueTotal.toLocaleString()}`;
    sub = `${isOverdue ? 'Overdue · due ' : 'Due '}${new Date(oldest.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (invoiceCount.paid > 0) {
    chip = { text: 'Up to date', cls: 'bg-emerald-50 text-emerald-700' };
    headline = 'Paid';
    sub = building.next_billing_date
      ? `Next bill ${new Date(building.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : 'No balance owing';
  } else {
    chip = { text: 'Yet to be billed', cls: 'bg-gray-100 text-gray-500' };
    headline = '₦0';
    sub = 'Your first invoice appears on your billing date';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => router.push('/caretaker-dashboard/payment')}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 hover:border-emerald-400 hover:shadow-xl"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-xl bg-emerald-50 p-3"><CreditCard className="h-6 w-6 text-emerald-600" /></div>
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${chip.cls}`}>
          {!loaded && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />}
          {chip.text}
        </span>
      </div>

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Billing</p>
      <p className="mt-1 text-4xl font-black tracking-tight text-gray-900">{headline}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
        {isOverdue && <CircleAlert className="h-4 w-4 text-red-500" />} {sub}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs font-semibold text-gray-500">
          <span>{invoiceCount.paid} paid · {loaded ? (pending || []).length : invoiceCount.due} due</span>
          {loaded && (pending || []).length === 0 && <CircleCheck className="h-4 w-4 text-emerald-500" />}
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm font-bold text-emerald-600">
          <span>{(pending || []).length > 0 ? 'View invoice' : 'View billing'}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
        {(pending || []).length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowAutopay(true); }}
            className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-100"
          >
            ⚡ Set Autopay
          </button>
        )}
      </div>
    </motion.div>
  );
}