// app/waste-company-dashboard/components/CompanyVerificationCard.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { motion } from 'framer-motion';
import { JetBrains_Mono } from 'next/font/google';
import { ShieldCheck, TriangleAlert, ArrowRight } from 'lucide-react';
import { getCompanyVerification, healEmailVerified } from '@/lib/auth/companyVerification';

const supabase = supabaseBrowser;
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props {
  companyId: string | number;
  onGoToSettings?: () => void;
}

export default function CompanyVerificationCard({ companyId, onGoToSettings }: Props) {
  const [hauler, setHauler] = useState<any>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    (async () => {
      const [row, sess] = await Promise.all([
        supabase.from('haulers').select('*').eq('id', Number(companyId)).maybeSingle(),
        supabase.auth.getSession(),
      ]);
      if (!alive) return;
      setSessionUser(sess.data?.session?.user ?? null);
      const healed = await healEmailVerified(supabase, row.data);
      if (!alive) return;
      setHauler(healed);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [companyId]);

  const v = getCompanyVerification(hauler, sessionUser);

  // UNKNOWN → neutral skeleton. Never flash a false negative.
  if (!ready) {
    return (
      <div className="inline-flex animate-pulse items-center gap-2 rounded-full bg-gray-100 px-4 py-2 ring-1 ring-gray-200">
        <span className="h-4 w-4 rounded-full bg-gray-200" />
        <span className="h-3 w-32 rounded bg-gray-200" />
      </div>
    );
  }

  if (v.canOperate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 ring-1 ring-emerald-200"
      >
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-emerald-700`}>
          Cleared to operate
        </span>
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-amber-200/70 bg-amber-50/60 px-6 py-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 ring-1 ring-amber-200">
          <TriangleAlert className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-extrabold text-gray-900">Verification needed</p>
          <p className="text-xs font-medium text-gray-600">Confirm your email and complete your profile to unlock buildings and drivers.</p>
        </div>
      </div>
      <button
        onClick={onGoToSettings}
        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600"
      >
        Complete in Settings <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.section>
  );
}