// app/admin/ledger/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  BookOpen, Coins, Wallet, TrendingUp, ChevronDown, ChevronRight,
  Link2, ArrowRightLeft, Building2,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

export default function AdminLedgerPage() {
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const [txRes, enRes, hRes] = await Promise.all([
        supabase.from('ledger_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('ledger_entries').select('*').order('created_at', { ascending: true }),
        supabase.from('haulers').select('id, business_name'),
      ]);
      if (!alive) return;
      setTxs(txRes.data || []);
      setEntries(enRes.data || []);
      const names: Record<string, string> = {};
      (hRes.data || []).forEach((h: any) => { names[String(h.id)] = h.business_name; });
      setOperatorNames(names);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const totals = useMemo(() => ({
    gross: txs.reduce((s, t) => s + (Number(t.gross) || 0), 0),
    commission: txs.reduce((s, t) => s + (Number(t.commission) || 0), 0),
    net: txs.reduce((s, t) => s + (Number(t.net) || 0), 0),
  }), [txs]);

  const operatorLedger = useMemo(() => {
    const map = new Map<string, { name: string; count: number; gross: number; commission: number; net: number }>();
    txs.forEach((t) => {
      const key = String(t.company_id ?? 'unattributed');
      const cur = map.get(key) || { name: operatorNames[key] || (t.company_id != null ? `Operator #${t.company_id}` : 'Unattributed'), count: 0, gross: 0, commission: 0, net: 0 };
      cur.count += 1;
      cur.gross += Number(t.gross) || 0;
      cur.commission += Number(t.commission) || 0;
      cur.net += Number(t.net) || 0;
      map.set(key, cur);
    });
    return [...map.entries()].sort((a, b) => b[1].gross - a[1].gross);
  }, [txs, operatorNames]);

  const entriesFor = (txId: string) => entries.filter((e) => e.transaction_id === txId);

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
      {/* HERO */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#0c1411] p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/70`}>
              Financial ledger · source of truth
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>
              Immutable money events
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Balances are never stored — they are derived from append-only transactions and their double-entry legs.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Gross</p>
              <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{formatN(totals.gross)}</p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Commission</p>
              <p className={`${display.className} mt-1 text-2xl font-black text-emerald-300`}>{formatN(totals.commission)}</p>
            </div>
            <div>
              <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Operator net</p>
              <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{formatN(totals.net)}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* OPERATOR LEDGERS + PLATFORM */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Wallet className="h-4 w-4" /> Operator ledgers
          </p>
          {operatorLedger.length === 0 ? (
            <p className="mt-6 text-sm font-semibold text-emerald-100/50">No ledger transactions yet — operator balances are real zeros.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {operatorLedger.map(([key, o], i) => (
                <motion.li key={key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05, ease: EASE }}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><Building2 className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-bold text-white">{o.name}</p>
                      <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{o.count} transaction{o.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-right">
                    <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Gross</p><p className="text-sm font-extrabold text-white">{formatN(o.gross)}</p></div>
                    <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Commission</p><p className="text-sm font-extrabold text-emerald-300">{formatN(o.commission)}</p></div>
                    <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Payable</p><p className="text-sm font-extrabold text-white">{formatN(o.net)}</p></div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <Coins className="h-4 w-4" /> Platform revenue
          </p>
          <p className={`${display.className} mt-4 text-4xl font-black tabular-nums text-white`}>{formatN(totals.commission)}</p>
          <p className="mt-1 text-sm font-semibold text-emerald-100/50">Retained commission across {txs.length} ledger transaction{txs.length === 1 ? '' : 's'}</p>
          <div className="mt-5 border-t border-white/5 pt-4">
            <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>Double-entry legs</p>
            <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{entries.length}</p>
            <p className="mt-1 text-xs font-semibold text-emerald-100/50">Append-only entries · never mutated</p>
          </div>
          <Link href="/admin/finance" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2.5 text-xs font-extrabold text-emerald-200 ring-1 ring-emerald-300/30 transition-colors hover:bg-emerald-400/20">
            <Link2 className="h-3.5 w-3.5" /> Reconciliation queue <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </motion.section>
      </div>

      {/* TRANSACTION FEED */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
            <ArrowRightLeft className="h-4 w-4" /> Transaction feed
          </p>
          <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{txs.length} total</span>
        </div>
        {txs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-emerald-300/40" />
            <p className={`${display.className} mt-4 text-lg font-extrabold text-white`}>Ledger is empty</p>
            <p className="mt-1 text-sm font-medium text-emerald-100/50">The first customer payment will append the first transaction.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {txs.map((t, i) => {
              const legs = entriesFor(t.id);
              const expanded = !!open[t.id];
              return (
                <motion.li key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease: EASE }}>
                  <button onClick={() => setOpen((o) => ({ ...o, [t.id]: !expanded }))}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.02]">
                    <div className="flex min-w-0 items-center gap-3">
                      {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-emerald-300" /> : <ChevronRight className="h-4 w-4 shrink-0 text-emerald-300/50" />}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${mono.className} rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-300/30`}>{t.type}</span>
                          <span className="text-sm font-bold text-white">{t.building_id}</span>
                          <span className="text-xs font-semibold text-emerald-100/50">{operatorNames[String(t.company_id)] || ''}</span>
                        </div>
                        <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>
                          {new Date(t.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {t.psp_reference && <> · PSP {t.psp_reference}</>} · {t.source}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-right">
                      <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Gross</p><p className="text-sm font-extrabold text-white">{formatN(Number(t.gross) || 0)}</p></div>
                      <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Fee</p><p className="text-sm font-extrabold text-emerald-300">{formatN(Number(t.commission) || 0)}</p></div>
                      <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Net</p><p className="text-sm font-extrabold text-white">{formatN(Number(t.net) || 0)}</p></div>
                    </div>
                  </button>
                  {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-white/5 bg-black/20 px-6 py-4">
                      <p className={`${mono.className} mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>Entries ({legs.length})</p>
                      {legs.length === 0 ? <p className="text-xs font-semibold text-emerald-100/40">No entries recorded for this transaction.</p> : (
                        <ul className="space-y-2">
                          {legs.map((e) => (
                            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                              <span className={`${mono.className} rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300`}>{e.account_kind}</span>
                              <span className="text-xs font-semibold text-emerald-100/60">{e.owner_type}{e.owner_id ? ` · ${e.owner_id}` : ''}</span>
                              <span className={`text-sm font-extrabold tabular-nums ${Number(e.amount) < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{formatN(Number(e.amount) || 0)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" /> Payment volume is not revenue — commission is revenue.
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <BookOpen className="h-3.5 w-3.5" /> Trakbin Ledger
        </span>
      </motion.footer>
    </div>
  );
}