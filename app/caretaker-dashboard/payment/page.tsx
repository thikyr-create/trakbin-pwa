"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate, useMotionValue, useTransform, type Variants } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  ArrowLeft, LogOut, Receipt, Wallet, CreditCard, Landmark, Plus, X,
  CheckCircle2, Clock, AlertCircle, ShieldCheck, ArrowUpRight, ArrowDownRight,
  Zap, Download, Lock, Activity, CalendarClock, Hash,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { formatNaira } from '@/lib/utils/money';
import CheckoutSheet from './components/CheckoutSheet';
import AddBankSheet from './components/AddBankSheet';
import AutopaySheet from './components/AutopaySheet';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function Counter({ value, prefix = '', duration = 1.1 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const row: Variants = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } } };
const reveal: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

type Tab = 'invoices' | 'history' | 'methods';
type CheckoutIntent = { mode: 'invoice' | 'topup'; invoiceId?: string; amount?: number; description?: string } | null;

export default function PaymentPage() {
  const router = useRouter();
  const {
    building, invoices, paymentMethods, walletBalance, ledger,
    companyProfile, loading, initializeSession, teardownRealtime, logout, refreshAll,
  } = useCaretakerSession();

  const [tab, setTab] = useState<Tab>('invoices');
  const [checkout, setCheckout] = useState<CheckoutIntent>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAutopay, setShowAutopay] = useState(false);

  useEffect(() => { initializeSession(); return () => teardownRealtime(); }, []);

  const provider = companyProfile?.business_name || 'your waste provider';
  const today = startOfToday();

  const unpaid = useMemo(() => invoices.filter((i) => i.status !== 'paid'), [invoices]);
  const totalOutstanding = unpaid.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const oldest = useMemo(() => (unpaid.length ? unpaid.reduce((a, b) => (new Date(a.due_date) <= new Date(b.due_date) ? a : b)) : null), [unpaid]);
  const isOverdue = unpaid.some((i) => new Date(i.due_date) < today);
  const allClear = unpaid.length === 0;
  const autopayOn = !!building?.autopay_enabled;
  const firstOfNext = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('en-NG', { month: 'long', day: 'numeric' }); })();

  const openInvoice = (inv: any) => setCheckout({ mode: 'invoice', invoiceId: inv.id, amount: Number(inv.amount), description: inv.description || 'Service invoice' });
  const openAddBank = () => { setShowAddBank(true); };

  if (!building) return null;

  const tabs: { id: Tab; label: string; Icon: typeof Receipt }[] = [
    { id: 'invoices', label: 'Invoices', Icon: Receipt },
    { id: 'history', label: 'History', Icon: Activity },
    { id: 'methods', label: 'Methods', Icon: CreditCard },
  ];

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-200/40 to-transparent" />
      </div>

      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => router.push('/caretaker-dashboard')} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-emerald-50 hover:text-emerald-600"><ArrowLeft size={20} /></motion.button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200"><span className={`${display.className} text-lg font-extrabold text-white`}>T</span></div>
              <div className="leading-none">
                <span className={`${display.className} block text-lg font-extrabold tracking-tight text-gray-900`}>Trakbin</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">billing</span>
              </div>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} onClick={logout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></motion.button>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600/80"><Receipt className="h-3.5 w-3.5" /> Billing console</p>
            <h1 className={`${display.className} mt-1 truncate text-3xl font-extrabold leading-[1.02] tracking-tight text-gray-900 sm:text-[40px]`}>{building.address || 'Your building'}</h1>
            <p className="mt-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-gray-400"><Hash className="h-3.5 w-3.5" /> {building.custom_id}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-gray-200">
            <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-500">{loading ? 'syncing' : 'live'}</span>
          </div>
        </motion.div>

        {/* HERO — R9: customer owes; no split */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative mb-6 overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70">Outstanding balance</p>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${allClear ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30' : isOverdue ? 'bg-rose-400/15 text-rose-100 ring-rose-300/30' : 'bg-amber-400/15 text-amber-100 ring-amber-300/30'}`}>
                <span className="relative flex h-2 w-2">{!allClear && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'currentColor' }} />}<span className={`relative inline-flex h-2 w-2 rounded-full ${allClear ? 'bg-emerald-300' : isOverdue ? 'bg-rose-300' : 'bg-amber-300'}`} /></span>
                {allClear ? <><CheckCircle2 className="h-3.5 w-3.5" /> All clear</> : isOverdue ? <><AlertCircle className="h-3.5 w-3.5" /> Overdue</> : <><Clock className="h-3.5 w-3.5" /> Due soon</>}
              </span>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className={`${display.className} text-6xl font-extrabold leading-[0.9] tracking-tight tabular-nums sm:text-7xl`}>{loading ? <span className="inline-block w-40 animate-pulse text-emerald-300/40">—</span> : <Counter value={totalOutstanding} prefix="₦" />}</span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-100/80">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              {allClear ? 'No invoices owing right now' : oldest ? <>Next due {new Date(oldest.due_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} · {unpaid.length} open</> : '—'}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => oldest && openInvoice(oldest)} disabled={allClear || loading} className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-extrabold text-emerald-700 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-emerald-100/50 disabled:shadow-none">
                {allClear ? <><CheckCircle2 className="h-5 w-5" /> Nothing to pay</> : <>Pay {formatNaira(oldest ? Number(oldest.amount) : 0)} now <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAutopay(true)} className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold ring-1 transition-all ${autopayOn ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30 hover:bg-emerald-400/25' : 'bg-white/5 text-emerald-100 ring-white/15 hover:bg-white/10'}`}><Zap className="h-4 w-4" /> {autopayOn ? 'Autopay on' : 'Set autopay'}</motion.button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-emerald-100/70">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Secured on‑platform</span>
              <span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-emerald-300" /> Receipt for every payment</span>
              {autopayOn && <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-emerald-300" /> Autopay settles on the 1st</span>}
            </div>
          </div>
        </motion.section>

        {/* wallet + autopay */}
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="relative overflow-hidden rounded-[22px] border border-emerald-300/40 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-200">
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-50/80"><Wallet className="h-4 w-4" /> Wallet balance</p>
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20"><Lock className="h-3 w-3" /> on‑platform</span>
              </div>
              <p className={`${display.className} mt-3 text-4xl font-extrabold tracking-tight tabular-nums`}>{loading ? <span className="inline-block w-28 animate-pulse text-emerald-100/40">—</span> : <Counter value={walletBalance} prefix="₦" />}</p>
              <p className="mt-1 text-xs font-medium text-emerald-50/80">Funds settle invoices automatically when autopay is on</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCheckout({ mode: 'topup' })} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-extrabold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add funds</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={openAddBank} className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"><Landmark className="h-4 w-4" /> Link bank</motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/80"><ShieldCheck className="h-4 w-4" /> Autopay</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${autopayOn ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${autopayOn ? 'bg-emerald-500' : 'bg-gray-400'}`} /> {autopayOn ? 'Active' : 'Off'}</span>
            </div>
            {autopayOn ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-600">We settle each invoice on the <span className="font-bold text-gray-900">1st</span> from your <span className="font-bold text-gray-900">wallet</span>.</p>
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Next charge</span><span className="text-sm font-bold text-gray-900">{firstOfNext}</span></div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-medium text-gray-500">Turn on autopay and every invoice settles itself the moment it&rsquo;s due — no overdue, no reminders.</p>
            )}
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAutopay(true)} className="mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100">{autopayOn ? 'Manage autopay' : 'Enable autopay'}</motion.button>
          </motion.div>
        </div>

        {/* tabs */}
        <div className="relative mb-5 flex gap-1 rounded-2xl bg-gray-100 p-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors">
                {active && <motion.span layoutId="paytab" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <span className={`relative z-10 flex items-center gap-2 ${active ? 'text-emerald-700' : 'text-gray-500'}`}><t.Icon className="h-4 w-4" /> {t.label}</span>
              </button>
            );
          })}
        </div>

        {/* INVOICES */}
        {tab === 'invoices' && (
          <motion.section key="inv" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
              <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Invoices</h2>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{unpaid.length} open · {invoices.length - unpaid.length} paid</span>
            </div>
            {invoices.length === 0 ? (
              <div className="relative px-6 py-16 text-center sm:px-8">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Receipt className="h-7 w-7 text-gray-300" /></div>
                <p className="relative mt-4 text-sm font-bold text-gray-700">No invoices yet</p>
                <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Your first invoice appears on your billing date. Until then, there&rsquo;s nothing to pay.</p>
              </div>
            ) : (
              <motion.ul variants={list} initial="hidden" animate="show" className="divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const paid = inv.status === 'paid';
                  const overdue = !paid && new Date(inv.due_date) < today;
                  return (
                    <motion.li key={inv.id} variants={row} className="group px-6 py-5 transition-colors hover:bg-gray-50/70 sm:px-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${paid ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : overdue ? 'bg-rose-50 text-rose-600 ring-rose-100' : 'bg-amber-50 text-amber-600 ring-amber-100'}`}>{paid ? <CheckCircle2 className="h-5 w-5" /> : overdue ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{inv.description || 'Service invoice'}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold text-gray-400"><CalendarClock className="h-3 w-3" /> due {new Date(inv.due_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`${display.className} text-lg font-extrabold tabular-nums text-gray-900`}>{formatNaira(inv.amount)}</p>
                            <p className={`font-mono text-[10px] font-bold uppercase tracking-wider ${paid ? 'text-emerald-600' : overdue ? 'text-rose-600' : 'text-amber-600'}`}>{paid ? 'paid' : overdue ? 'overdue' : 'unpaid'}</p>
                          </div>
                          {!paid ? (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openInvoice(inv)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700">Pay</motion.button>
                          ) : (
                            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100" title="Download receipt"><Download size={16} /></button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pl-[52px] text-[11px] font-semibold text-gray-400">
                        {paid ? <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Paid {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                              : <span className="opacity-0 transition-opacity group-hover:opacity-100">Due {new Date(inv.due_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })} · pay by card, bank, USSD or wallet</span>}
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </motion.section>
        )}

        {/* HISTORY — customer projection only (R9) */}
        {tab === 'history' && (
          <motion.section key="hist" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">
              <h2 className={`${display.className} flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-gray-900`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Activity className="h-4 w-4" /></span> Payment history</h2>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{ledger.length} entries</span>
            </div>
            {ledger.length === 0 ? (
              <div className="relative px-6 py-16 text-center sm:px-8">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Wallet className="h-7 w-7 text-gray-300" /></div>
                <p className="relative mt-4 text-sm font-bold text-gray-700">No activity yet</p>
                <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Every top‑up and payment you make is recorded here in order, with the amount taken from your wallet.</p>
              </div>
            ) : (
              <motion.ul variants={list} initial="hidden" animate="show" className="divide-y divide-gray-100">
                {ledger.map((t) => {
                  const isTopup = t.type === 'topup';
                  const gross = Number(t.gross) || 0;
                  return (
                    <motion.li key={t.id} variants={row} className="group px-6 py-5 transition-colors hover:bg-gray-50/70 sm:px-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${isTopup ? 'bg-sky-50 text-sky-600 ring-sky-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'}`}>{isTopup ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}</span>
                          <div>
                            <p className="flex items-center gap-2 text-sm font-bold text-gray-900">{isTopup ? 'Wallet top‑up' : 'Service payment'}<span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500">{t.status}</span></p>
                            <p className="mt-0.5 font-mono text-[11px] font-semibold text-gray-400">{isTopup ? 'Funds added to your wallet' : 'Invoice paid from your wallet'} · {new Date(t.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <p className={`${display.className} text-lg font-extrabold tabular-nums ${isTopup ? 'text-sky-600' : 'text-gray-900'}`}>{isTopup ? '+' : '−'}{formatNaira(gross)}</p>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </motion.section>
        )}

        {/* METHODS — linked instruments */}
        {tab === 'methods' && (
          <motion.section key="meth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
              <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Payment methods</h2>
              <motion.button whileTap={{ scale: 0.96 }} onClick={openAddBank} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100"><Plus size={16} /> Link bank</motion.button>
            </div>
            {paymentMethods.length === 0 ? (
              <div className="relative px-6 py-16 text-center sm:px-8">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Landmark className="h-7 w-7 text-gray-300" /></div>
                <p className="relative mt-4 text-sm font-bold text-gray-700">No linked banks yet</p>
                <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Link a bank account to fund your wallet in one tap. We verify the account name before saving and never store the full number.</p>
              </div>
            ) : (
              <motion.ul variants={list} initial="hidden" animate="show" className="divide-y divide-gray-100">
                {paymentMethods.map((m: any) => (
                  <motion.li key={m.id} variants={row} className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-gray-50/70 sm:px-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-700 ring-1 ring-gray-100 transition-transform group-hover:scale-105">{m.instrument_type === 'bank_account' || m.type === 'bank' ? <Landmark className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{m.instrument_type === 'bank_account' || m.type === 'bank' ? `${m.bank_name || 'Bank'} •••• ${m.account_last4 || m.account_number}` : `${(m.card_brand || 'card').toUpperCase()} •••• ${m.card_last_four}`}</p>
                        <p className="mt-0.5 text-xs font-semibold text-gray-500">{m.instrument_type === 'bank_account' || m.type === 'bank' ? m.account_name : 'Credit / debit card'}</p>
                      </div>
                    </div>
                    {m.is_default && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">default</span>}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.section>
        )}

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500"><Lock className="h-3.5 w-3.5 text-emerald-500" /> Payments are recorded against your wallet · receipts on every charge</span>
          <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400"><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin Billing</span>
        </motion.footer>
      </main>

      <CheckoutSheet open={!!checkout} mode={checkout?.mode ?? 'topup'} invoiceId={checkout?.invoiceId} amount={checkout?.amount} description={checkout?.description} onClose={() => setCheckout(null)} onLinkBank={() => { setCheckout(null); setShowAddBank(true); }} />
      <AddBankSheet open={showAddBank} onClose={() => setShowAddBank(false)} />
      <AutopaySheet open={showAutopay} onClose={() => setShowAutopay(false)} onLinkBank={() => { setShowAutopay(false); setShowAddBank(true); }} />
    </div>
  );
}