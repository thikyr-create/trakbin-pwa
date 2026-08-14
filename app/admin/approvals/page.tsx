// app/admin/approvals/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  CheckSquare, Wallet, Inbox, TriangleAlert, CircleCheck, CircleX,
  Loader2, Eye,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

export default function AdminApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [payoutQueue, setPayoutQueue] = useState<any[]>([]);
  const [serviceQueue, setServiceQueue] = useState<any[]>([]);
  const [issueQueue, setIssueQueue] = useState<any[]>([]);
  const [busy, setBusy] = useState<Record<string, string>>({});

  const load = async () => {
    const [p, s, i] = await Promise.all([
      supabase.from('payouts').select('*').in('status', ['requested', 'pending', 'approved']).order('created_at', { ascending: false }),
      supabase.from('service_requests').select('*').eq('status', 'pending').order('submitted_at', { ascending: true }),
      supabase.from('environmental_issues').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
    ]);
    setPayoutQueue(p.data || []);
    setServiceQueue(s.data || []);
    setIssueQueue(i.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusy((b) => ({ ...b, [id]: action }));
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json();
    setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    if (json.ok) load();
    else alert(json.error || 'Action failed');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const total = payoutQueue.length + serviceQueue.length + issueQueue.length;

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex items-end justify-between gap-6">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>Approvals · decision surface</p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Awaiting decision</h1>
          </div>
          <p className={`${display.className} text-5xl font-black tabular-nums text-white`}>{total}</p>
        </div>
      </motion.section>

      {/* SETTLEMENT REQUESTS — actionable */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-amber-400/30 bg-amber-400/[0.06]">
        <div className="flex items-center justify-between border-b border-amber-400/20 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/80`}>
            <Wallet className="h-4 w-4" /> Settlement requests
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-amber-200/70`}>{payoutQueue.length}</span>
        </div>
        {payoutQueue.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-semibold text-amber-100/60">No settlement requests awaiting decision.</p>
        ) : (
          <ul className="divide-y divide-amber-400/10">
            {payoutQueue.map((p, i) => (
              <motion.li key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-extrabold text-white">{formatN(Number(p.amount) || 0)} <span className={`${mono.className} ml-2 text-[10px] font-bold uppercase text-amber-200/60`}>{p.status}</span></p>
                  <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-100/50`}>
                    {p.recipient_bank_name || '—'} ····{p.recipient_account_last4 || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} disabled={!!busy[p.id]} onClick={() => act(p.id, 'approve')}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:bg-white/10 disabled:text-white/40">
                    {busy[p.id] === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleCheck className="h-3.5 w-3.5" />} Approve
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} disabled={!!busy[p.id]} onClick={() => act(p.id, 'reject')}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-400/90 px-4 py-2 text-xs font-extrabold text-rose-950 hover:bg-rose-300 disabled:bg-white/10 disabled:text-white/40">
                    {busy[p.id] === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleX className="h-3.5 w-3.5" />} Reject
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* SERVICE REQUESTS — visible queue */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Inbox className="h-4 w-4" /> Property service requests
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{serviceQueue.length}</span>
        </div>
        {serviceQueue.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-semibold text-emerald-100/50">No pending service requests.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {serviceQueue.map((s, i) => (
              <motion.li key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-white">{s.building_id}</p>
                  <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                    {s.request_number} · {new Date(s.submitted_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50 ring-1 ring-white/10">
                  <Eye className="h-3 w-3" /> handled in company dashboards
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* FIELD ISSUES — visible queue */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <TriangleAlert className="h-4 w-4" /> Field issues
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{issueQueue.length}</span>
        </div>
        {issueQueue.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-semibold text-emerald-100/50">No pending field issues.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {issueQueue.map((s: any, i) => (
              <motion.li key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, ease: EASE }}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-white">{s.issue_type}</p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-100/50">{s.description || s.building_id || ''}</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50 ring-1 ring-white/10">
                  <Eye className="h-3 w-3" /> handled in company dashboards
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <CheckSquare className="h-3.5 w-3.5 text-emerald-300" /> Decisions are server-gated · admin role verified per request
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <CheckSquare className="h-3.5 w-3.5" /> Trakbin Approvals
        </span>
      </motion.footer>
    </div>
  );
}