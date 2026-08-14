// app/admin/payments/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  CreditCard, CheckCircle2, XCircle, Clock, RotateCcw, Search,
  Filter, ArrowUpDown,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

type Tab = 'all' | 'success' | 'pending' | 'failed' | 'refunded';

const TABS = {
  all: { label: 'All', Icon: CreditCard },
  success: { label: 'Successful', Icon: CheckCircle2 },
  pending: { label: 'Pending', Icon: Clock },
  failed: { label: 'Failed', Icon: XCircle },
  refunded: { label: 'Refunded', Icon: RotateCcw },
} as const;

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'amount'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let alive = true;
    (async () => {
      // payments has NO company_id and NO FKs — fetch plain, merge client-side
      const [payRes, bRes, hRes, ltRes] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('Buildings').select('custom_id, address, company_id'),
        supabase.from('haulers').select('id, business_name'),
        supabase.from('ledger_transactions').select('id, commission, commission_bps, net, gross'),
      ]);
      if (!alive) return;

      const buildings = bRes.data || [];
      const haulers = hRes.data || [];
      const ledgerById = new Map((ltRes.data || []).map((t: any) => [t.id, t]));

      const merged = (payRes.data || []).map((p: any) => {
        const building = buildings.find((b: any) => b.custom_id === p.building_id);
        const operator = haulers.find((h: any) => h.id === building?.company_id);
        const ledger = ledgerById.get(p.ledger_settle_tx) || ledgerById.get(p.ledger_topup_tx);
        return {
          ...p,
          _address: building?.address || null,
          _operator: operator?.business_name || null,
          _commission: ledger?.commission ?? null,
          _commissionBps: ledger?.commission_bps ?? null,
          _net: ledger?.net ?? null,
        };
      });

      setPayments(merged);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = payments;
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.reference?.toLowerCase().includes(q) ||
        p.building_id?.toLowerCase().includes(q) ||
        p.payer_email?.toLowerCase().includes(q) ||
        (p._operator || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortField]; const bv = b[sortField];
      if (sortField === 'amount') {
        return sortDir === 'asc' ? (Number(av) || 0) - (Number(bv) || 0) : (Number(bv) || 0) - (Number(av) || 0);
      }
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
  }, [payments, filter, search, sortField, sortDir]);

  const counts = useMemo(() => ({
    all: payments.length,
    success: payments.filter((p) => p.status === 'success').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    refunded: payments.filter((p) => p.status === 'refunded').length,
  }), [payments]);

  const toggleSort = (f: 'created_at' | 'amount') => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10">
          <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
            Financial operations · payments
          </p>
          <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Payment trace</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
            Every customer payment with full attribution: building, operator, processor reference, commission, operator payable.
          </p>
        </div>
      </motion.section>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TABS) as Tab[]).map((t) => {
          const { label, Icon } = TABS[t];
          const active = filter === t;
          return (
            <button key={t} onClick={() => setFilter(t)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                active ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30'
                       : 'bg-white/5 text-emerald-100/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className="h-4 w-4" /> {label}
              <span className={`${mono.className} text-xs font-bold ${active ? 'text-emerald-900' : 'text-emerald-300/60'}`}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/40" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, building, payer, operator…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-emerald-100/40 outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20" />
        </div>
        <button onClick={() => toggleSort('created_at')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${sortField === 'created_at' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5 text-emerald-100/70 hover:bg-white/10'}`}>
          <ArrowUpDown className="h-4 w-4" /> Date {sortField === 'created_at' && <span className="text-xs">{sortDir === 'desc' ? '↓' : '↑'}</span>}
        </button>
        <button onClick={() => toggleSort('amount')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${sortField === 'amount' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5 text-emerald-100/70 hover:bg-white/10'}`}>
          <ArrowUpDown className="h-4 w-4" /> Amount {sortField === 'amount' && <span className="text-xs">{sortDir === 'desc' ? '↓' : '↑'}</span>}
        </button>
      </div>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-emerald-300/40" />
            <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>No payments found</p>
            <p className="mt-1 text-sm font-medium text-emerald-100/50">
              {filter === 'all' ? 'No payments in the system yet.' : `No ${filter} payments.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            <AnimatePresence>
              {filtered.map((p, i) => {
                const amount = Number(p.amount) || 0;
                const commission = p._commission != null ? Number(p._commission) : null;
                const net = p._net != null ? Number(p._net) : (commission != null ? amount - commission : null);
                const tone = p.status === 'failed' ? 'text-rose-300 bg-rose-400/10 ring-rose-300/30'
                  : p.status === 'pending' ? 'text-amber-300 bg-amber-400/10 ring-amber-300/30'
                  : p.status === 'refunded' ? 'text-blue-300 bg-blue-400/10 ring-blue-300/30'
                  : 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30';
                return (
                  <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.02, ease: EASE }} className="px-6 py-5 transition-colors hover:bg-white/[0.02]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${tone}`}>
                            {p.status}
                          </span>
                          <span className={`${mono.className} text-xs font-bold text-emerald-100/60`}>{p.reference || p.id}</span>
                          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{p.provider}{p.channel ? ` · ${p.channel}` : ''}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="font-semibold text-white">{p.building_id || 'Unknown'}</span>
                          <span className="text-emerald-100/50">{p._address || ''}</span>
                          {p._operator && <><span className="text-emerald-100/40">·</span><span className="font-semibold text-emerald-300">{p._operator}</span></>}
                        </div>
                        <div className={`${mono.className} mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                          <span>{new Date(p.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          {p.payer_email && <span>{p.payer_email}</span>}
                          {p.invoice_id && <span>INV: {p.invoice_id}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className={`${display.className} text-2xl font-black text-white`}>{formatN(amount)}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-300/70"><span className="font-bold">Commission:</span> {commission != null ? formatN(commission) : '—'}</span>
                          <span className="text-emerald-100/50"><span className="font-bold">Payable:</span> {net != null ? formatN(net) : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Filter className="h-3.5 w-3.5 text-emerald-300" /> {filtered.length} of {payments.length} payments
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <CreditCard className="h-3.5 w-3.5" /> Trakbin Payments
        </span>
      </motion.footer>
    </div>
  );
}