// app/admin/billing/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  Receipt, CreditCard, Wallet, Coins, Link2, RotateCcw, CircleX,
  Settings, Landmark, ShieldCheck, ArrowRightLeft, TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useBilling } from '@/lib/super-admin/hooks/useBilling';
import { getConfig, type PlatformConfig } from '@/lib/super-admin/services/settings.service';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const formatN = (n: number) => '₦' + n.toLocaleString('en-NG');

type Tab = 'revenue' | 'invoices' | 'payments' | 'outstanding' | 'settlements'
  | 'reconciliation' | 'refunds' | 'failed' | 'credits' | 'settings';

const TABS: { key: Tab; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'reconciliation', label: 'Reconciliation' },
  { key: 'refunds', label: 'Refunds' },
  { key: 'failed', label: 'Failed Payments' },
  { key: 'credits', label: 'Credits & Adjustments' },
  { key: 'settings', label: 'Billing Settings' },
];

function invoiceTone(s: string) {
  if (s === 'paid') return 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30';
  if (s === 'overdue') return 'text-rose-300 bg-rose-400/10 ring-rose-300/30';
  return 'text-amber-300 bg-amber-400/10 ring-amber-300/30';
}
function payTone(s: string) {
  if (s === 'success') return 'text-emerald-300 bg-emerald-400/10 ring-emerald-300/30';
  if (s === 'failed') return 'text-rose-300 bg-rose-400/10 ring-rose-300/30';
  if (s === 'refunded') return 'text-blue-300 bg-blue-400/10 ring-blue-300/30';
  return 'text-amber-300 bg-amber-400/10 ring-amber-300/30';
}

export default function AdminBillingPage() {
  const { billing: b, loading } = useBilling();
  const [tab, setTab] = useState<Tab>('revenue');
  const [unmatched, setUnmatched] = useState<any[]>([]);
  const [reconciling, setReconciling] = useState<Record<string, string>>({});
  const [cfg, setCfg] = useState<PlatformConfig | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/finance/unmatched').then((r) => r.json()).then((j) => {
      if (alive && j.ok) setUnmatched(j.events || []);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => { getConfig().then(setCfg).catch(() => {}); }, []);

  const reconcile = async (eventId: string) => {
    const payoutId = prompt('Enter the payout ID this transfer belongs to:');
    if (!payoutId) return;
    setReconciling((r) => ({ ...r, [eventId]: payoutId }));
    const res = await fetch('/api/admin/finance/reconcile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, payoutId }),
    });
    const json = await res.json();
    setReconciling((r) => { const n = { ...r }; delete n[eventId]; return n; });
    if (json.ok) setUnmatched((u) => u.filter((e) => e.id !== eventId));
    else alert(json.reason || json.error || 'Reconcile failed');
  };

  if (loading || !b) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div className="h-10 w-10 rounded-full border-b-2 border-emerald-400"
          animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
      </div>
    );
  }

  const t = b.totals;
  const outstandingInvoices = b.invoices.filter((i: any) => i.status !== 'paid');
  const refunds = b.payments.filter((p: any) => p.status === 'refunded');
  const failed = b.payments.filter((p: any) => p.status === 'failed');

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
              Platform billing · the money plane
            </p>
            <h1 className={`${display.className} mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl`}>Billing & settlement</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-emerald-100/70">
              Trakbin owns financial state · the licensed processor moves money · the ledger is the source of truth.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Gross</p><p className={`${display.className} mt-1 text-2xl font-black text-white`}>{formatN(t.gross)}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Commission</p><p className={`${display.className} mt-1 text-2xl font-black text-emerald-300`}>{formatN(t.commission)}</p></div>
            <div><p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-300/60`}>Outstanding</p><p className={`${display.className} mt-1 text-2xl font-black text-amber-300`}>{formatN(t.outstanding)}</p></div>
          </div>
        </div>
      </motion.section>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button key={x.key} onClick={() => setTab(x.key)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              tab === x.key ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/30'
                            : 'bg-white/5 text-emerald-100/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            {x.label}
          </button>
        ))}
      </div>

      {/* REVENUE */}
      {tab === 'revenue' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
            <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}><Coins className="h-4 w-4" /> Operator ledgers</p>
            {b.balances.length === 0 ? <p className="mt-5 text-sm font-semibold text-emerald-100/50">No ledger activity yet.</p> : (
              <ul className="mt-4 divide-y divide-white/5">
                {b.balances.map((o) => (
                  <li key={o.key} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div><p className="text-sm font-bold text-white">{o.name}</p>
                      <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>earned {formatN(o.earned)} · withdrawn {formatN(o.withdrawn)}</p></div>
                    <div className="text-right"><p className={`${mono.className} text-[9px] font-bold uppercase tracking-wider text-emerald-100/40`}>Available</p>
                      <p className={`${display.className} text-lg font-black ${o.available > 0 ? 'text-emerald-300' : 'text-white'}`}>{formatN(o.available)}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>Platform revenue</p>
            <p className={`${display.className} mt-4 text-4xl font-black text-white`}>{formatN(t.commission)}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-100/50">Payment commissions retained</p>
            <div className="mt-5 border-t border-white/5 pt-4">
              <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>Subscription revenue</p>
              <p className={`${display.className} mt-1 text-2xl font-black text-white`}>{formatN(0)}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-100/40">MRR lives in Subscriptions — separate ledger, never mixed</p>
            </div>
            <p className="mt-4 text-xs font-semibold text-emerald-100/40">Payment volume is not revenue.</p>
          </motion.section>
        </div>
      )}

      {/* INVOICES */}
      {tab === 'invoices' && (
        <Section title="Invoices" Icon={Receipt} count={b.invoices.length}>
          {b.invoices.length === 0 ? <Empty label="No invoices yet." /> : b.invoices.map((i: any) => (
            <Row key={i.id}
              left={<><p className="text-sm font-extrabold text-white">{i.building_id}</p><p className="mt-0.5 text-xs font-semibold text-emerald-100/50">{i.description}</p></>}
              right={<span className={`${display.className} text-lg font-black text-white`}>{formatN(Number(i.amount) || 0)}</span>}
              badge={<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${invoiceTone(i.status)}`}>{i.status}</span>}
              meta={`due ${i.due_date || '—'}${i.paid_at ? ` · paid ${new Date(i.paid_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}` : ''}`} />
          ))}
        </Section>
      )}

      {/* PAYMENTS */}
      {tab === 'payments' && (
        <Section title="Payment trace" Icon={CreditCard} count={b.payments.length}>
          {b.payments.length === 0 ? <Empty label="No payments yet." /> : b.payments.map((p: any) => (
            <Row key={p.id}
              left={<><p className="text-sm font-extrabold text-white">{p.building_id} <span className={`${mono.className} ml-2 text-[10px] font-bold text-emerald-100/40`}>{p.reference || p.id}</span></p>
                <p className="mt-0.5 text-xs font-semibold text-emerald-100/50">{p._address || ''}{p._operator && ` · ${p._operator}`}</p></>}
              right={<span className={`${display.className} text-lg font-black text-white`}>{formatN(Number(p.amount) || 0)}</span>}
              badge={<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${payTone(p.status)}`}>{p.status}</span>}
              meta={`${p.provider || ''} · commission ${p._commission != null ? formatN(p._commission) : '—'} · payable ${p._net != null ? formatN(p._net) : '—'}`} />
          ))}
        </Section>
      )}

      {/* OUTSTANDING */}
      {tab === 'outstanding' && (
        <Section title="Outstanding" Icon={TriangleAlert} count={outstandingInvoices.length}>
          {outstandingInvoices.length === 0 ? <Empty label="Nothing outstanding. Every invoice is paid." /> : outstandingInvoices.map((i: any) => (
            <Row key={i.id}
              left={<><p className="text-sm font-extrabold text-white">{i.building_id}</p><p className="mt-0.5 text-xs font-semibold text-emerald-100/50">{i.description}</p></>}
              right={<span className={`${display.className} text-lg font-black text-amber-300`}>{formatN(Number(i.amount) || 0)}</span>}
              badge={<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${invoiceTone(i.status)}`}>{i.status}</span>}
              meta={`due ${i.due_date || '—'}`} />
          ))}
        </Section>
      )}

      {/* SETTLEMENTS */}
      {tab === 'settlements' && (
        <Section title="Payout requests · state machine" Icon={Wallet} count={b.payouts.length}>
          {b.payouts.length === 0 ? <Empty label="No settlement requests yet. Requested → Approved → Processing → Processor confirmed → Completed." /> : b.payouts.map((p: any) => (
            <Row key={p.id}
              left={<><p className="text-sm font-extrabold text-white">{formatN(Number(p.amount) || 0)}</p>
                <p className={`${mono.className} mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{p.recipient_bank_name || '—'} ····{p.recipient_account_last4 || '—'}</p></>}
              right={<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${payTone(p.status === 'completed' ? 'success' : p.status)}`}>{p.status}</span>}
              badge={null}
              meta={new Date(p.created_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
          ))}
        </Section>
      )}

      {/* RECONCILIATION */}
      {tab === 'reconciliation' && (
        <Section title="Reconciliation queue" Icon={Link2} count={unmatched.length}>
          {unmatched.length === 0 ? <Empty label="All transfers reconciled." /> : unmatched.map((e: any) => (
            <Row key={e.id}
              left={<><p className={`${mono.className} text-sm font-bold text-white`}>{e.transfer_code}</p>
                <p className="mt-0.5 text-xs font-semibold text-amber-100/60">{e.status}{e.amount != null && ` · ${formatN(e.amount)}`}</p></>}
              right={<button onClick={() => reconcile(e.id)} disabled={!!reconciling[e.id]}
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-amber-950 hover:bg-amber-300 disabled:bg-white/10 disabled:text-white/40">
                {reconciling[e.id] ? 'Matching…' : 'Match to payout'}
              </button>}
              badge={null} meta={new Date(e.received_at).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} />
          ))}
          <div className="px-6 py-4">
            <Link href="/admin/finance" className="text-xs font-extrabold text-emerald-300 hover:text-emerald-200">Open full finance command surface →</Link>
          </div>
        </Section>
      )}

      {/* REFUNDS */}
      {tab === 'refunds' && (
        <Section title="Refunds" Icon={RotateCcw} count={refunds.length}>
          {refunds.length === 0 ? <Empty label="No refunds. Real zero." /> : refunds.map((p: any) => (
            <Row key={p.id} left={<p className="text-sm font-extrabold text-white">{p.building_id}</p>}
              right={<span className={`${display.className} text-lg font-black text-blue-300`}>{formatN(Number(p.amount) || 0)}</span>}
              badge={<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${payTone('refunded')}`}>refunded</span>}
              meta={p.reference || ''} />
          ))}
        </Section>
      )}

      {/* FAILED */}
      {tab === 'failed' && (
        <Section title="Failed payments" Icon={CircleX} count={failed.length}>
          {failed.length === 0 ? <Empty label="No failed payments. Real zero." /> : failed.map((p: any) => (
            <Row key={p.id} left={<p className="text-sm font-extrabold text-white">{p.building_id}</p>}
              right={<span className={`${display.className} text-lg font-black text-rose-300`}>{formatN(Number(p.amount) || 0)}</span>}
              badge={<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${payTone('failed')}`}>failed</span>}
              meta={p.reference || ''} />
          ))}
        </Section>
      )}

      {/* CREDITS */}
      {tab === 'credits' && (
        <Section title="Credits & adjustments" Icon={Landmark} count={0}>
          <Empty label="No credits or adjustments. The adjustment engine lands with the billing engine hardening." />
        </Section>
      )}

      {/* SETTINGS — config-driven */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
            className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
            <p className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50`}><Settings className="h-3.5 w-3.5" /> Commission model</p>
            <p className={`${display.className} mt-2 text-2xl font-black text-white`}>
              {((cfg?.commissionBps ?? 1000) / 100).toFixed(1).replace(/\.0$/, '')}% <span className="text-xs text-emerald-100/50">({cfg?.commissionBps ?? 1000} bps)</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-emerald-100/40">Live from platform_config · edited in Settings → Billing</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
            className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
            <p className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50`}><ShieldCheck className="h-3.5 w-3.5" /> Processor</p>
            <p className={`${display.className} mt-2 text-2xl font-black text-white`}>Paystack</p>
            <p className="mt-1 text-xs font-semibold text-emerald-100/40">Behind the provider interface · processor-independent</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
            className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
            <p className={`${mono.className} flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50`}><ArrowRightLeft className="h-3.5 w-3.5" /> Settlement rule</p>
            <p className={`${display.className} mt-2 text-2xl font-black text-white`}>Never on request</p>
            <p className="mt-1 text-xs font-semibold text-emerald-100/40">
              Auto ≤ {formatN(cfg?.tiers.auto ?? 500000)} · review ≤ {formatN(cfg?.tiers.review ?? 5000000)} · above = enhanced
            </p>
          </motion.div>
        </div>
      )}

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/50">
          <Receipt className="h-3.5 w-3.5 text-emerald-300" /> Two ledgers, never mixed · customer payments ≠ subscription revenue
        </span>
        <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/60`}>
          <Receipt className="h-3.5 w-3.5" /> Trakbin Billing
        </span>
      </motion.footer>
    </div>
  );
}

function Section({ title, Icon, count, children }: { title: string; Icon: any; count: number; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/70`}>
          <Icon className="h-4 w-4" /> {title}
        </p>
        <span className={`${mono.className} text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{count}</span>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </motion.section>
  );
}

function Row({ left, right, badge, meta }: { left: React.ReactNode; right: React.ReactNode; badge: React.ReactNode; meta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
      <div className="min-w-0 flex-1">{left}
        {meta && <p className={`${mono.className} mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100/40`}>{meta}</p>}
      </div>
      <div className="flex items-center gap-3">{badge}{right}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="px-6 py-14 text-center text-sm font-semibold text-emerald-100/50">{label}</p>;
}