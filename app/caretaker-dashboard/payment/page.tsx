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
    building, invoices, paymentMethods, walletBalance, ledger, autopaySource,
    companyProfile, loading, initializeSession, teardownRealtime, logout,
    saveAutopay, disableAutopay, setAutopaySource, refreshAll,
  } = useCaretakerSession();

  const [tab, setTab] = useState<Tab>('invoices');
  const [checkout, setCheckout] = useState<CheckoutIntent>(null);
  const [showMethod, setShowMethod] = useState(false);
  const [showAutopay, setShowAutopay] = useState(false);

  const [methodType, setMethodType] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);

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

  const confirmAddMethod = async () => {
    if (!building) return;
    setSaving(true);
    const data: any = { building_id: building.custom_id, type: methodType, is_default: paymentMethods.length === 0 };
    if (methodType === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 12) { setSaving(false); return; }
      data.card_last_four = cardNumber.replace(/\s/g, '').slice(-4);
      data.card_brand = cardNumber.startsWith('4') ? 'visa' : cardNumber.startsWith('5') ? 'mastercard' : 'card';
    } else {
      if (!bankName || accountNumber.replace(/\s/g, '').length < 8 || !accountName) { setSaving(false); return; }
      data.bank_name = bankName; data.account_number = accountNumber.replace(/\s/g, '').slice(-4); data.account_name = accountName;
    }
    const { error } = await supabaseInsertMethod(data);
    if (error) alert('Could not save payment method: ' + error.message);
    else { await refreshAll(); setShowMethod(false); resetMethodForm(); }
    setSaving(false);
  };
  const resetMethodForm = () => { setCardNumber(''); setCardExpiry(''); setCardCvv(''); setBankName(''); setAccountNumber(''); setAccountName(''); };
  const confirmAutopay = async () => { setSaving(true); await saveAutopay(); setSaving(false); setShowAutopay(false); };
  const confirmDisableAutopay = async () => { setSaving(true); await disableAutopay(); setSaving(false); setShowAutopay(false); };

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

        {/* HERO — customer owes; the single act of clearing it. R9: no split here. */}
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
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCheckout({ mode: 'topup' })} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-extrabold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add funds</motion.button>
            </div>
          </motion.div>

          <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} whileHover={{ y: -3 }} className="rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/80"><ShieldCheck className="h-4 w-4" /> Autopay</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${autopayOn ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${autopayOn ? 'bg-emerald-500' : 'bg-gray-400'}`} /> {autopayOn ? 'Active' : 'Off'}</span>
            </div>
            {autopayOn ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-600">We settle each invoice on the <span className="font-bold text-gray-900">1st</span> from your <span className="font-bold text-gray-900">{autopaySource}</span>.</p>
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

        {/* METHODS */}
        {tab === 'methods' && (
          <motion.section key="meth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
              <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Payment methods</h2>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowMethod(true)} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100"><Plus size={16} /> Add new</motion.button>
            </div>
            {paymentMethods.length === 0 ? (
              <div className="relative px-6 py-16 text-center sm:px-8">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><CreditCard className="h-7 w-7 text-gray-300" /></div>
                <p className="relative mt-4 text-sm font-bold text-gray-700">No payment methods yet</p>
                <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Saved instruments for autopay and quick funding appear here once you add one.</p>
              </div>
            ) : (
              <motion.ul variants={list} initial="hidden" animate="show" className="divide-y divide-gray-100">
                {paymentMethods.map((m) => (
                  <motion.li key={m.id} variants={row} className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-gray-50/70 sm:px-8">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-700 ring-1 ring-gray-100 transition-transform group-hover:scale-105">{m.type === 'card' ? <CreditCard className="h-6 w-6" /> : <Landmark className="h-6 w-6" />}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{m.type === 'card' ? `${(m.card_brand || 'card').toUpperCase()} •••• ${m.card_last_four}` : `${m.bank_name} •••• ${m.account_number}`}</p>
                        <p className="mt-0.5 text-xs font-semibold text-gray-500">{m.type === 'card' ? 'Credit / debit card' : m.account_name}</p>
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

      {/* the single, method-aware checkout — wallet + external rails */}
      <CheckoutSheet open={!!checkout} mode={checkout?.mode ?? 'topup'} invoiceId={checkout?.invoiceId} amount={checkout?.amount} description={checkout?.description} onClose={() => setCheckout(null)} />

      {/* ADD METHOD MODAL */}
      <AnimatePresence>
        {showMethod && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !saving && setShowMethod(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className={`${display.className} text-xl font-extrabold tracking-tight text-gray-900`}>Add payment method</h3>
                <button onClick={() => !saving && setShowMethod(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
              </div>
              <div className="mb-5 grid grid-cols-2 gap-2">
                <button onClick={() => setMethodType('card')} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${methodType === 'card' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><CreditCard size={18} /> Card</button>
                <button onClick={() => setMethodType('bank')} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${methodType === 'bank' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Landmark size={18} /> Bank</button>
              </div>
              {methodType === 'card' ? (
                <div className="space-y-3">
                  <Field label="Card number"><input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" placeholder="4242 4242 4242 4242" className={inputCls} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry"><input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className={inputCls} /></Field>
                    <Field label="CVV"><input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} inputMode="numeric" placeholder="123" className={inputCls} /></Field>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Bank name"><input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="First Bank of Nigeria" className={inputCls} /></Field>
                  <Field label="Account number"><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} inputMode="numeric" placeholder="0123456789" className={inputCls} /></Field>
                  <Field label="Account name"><input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Jane Doe" className={inputCls} /></Field>
                </div>
              )}
              <p className="mt-3 flex items-center gap-2 text-[11px] font-medium text-gray-400"><Lock className="h-3.5 w-3.5" /> Stored securely · only a token is kept on our side once a real PSP is live</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => { setShowMethod(false); resetMethodForm(); }} disabled={saving} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={confirmAddMethod} disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none">{saving ? 'Saving…' : 'Add method'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTOPAY MODAL */}
      <AnimatePresence>
        {showAutopay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !saving && setShowAutopay(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className={`${display.className} text-xl font-extrabold tracking-tight text-gray-900`}>{autopayOn ? 'Manage autopay' : 'Enable autopay'}</h3>
                <button onClick={() => !saving && setShowAutopay(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
              </div>
              <p className="mb-4 text-sm font-medium text-gray-500">On the <span className="font-bold text-gray-900">1st</span> of every month we settle your invoice automatically from the source below.</p>
              <div className="mb-5 space-y-2">
                <button onClick={() => setAutopaySource('wallet')} className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${autopaySource === 'wallet' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700"><Wallet className="h-5 w-5" /></span>
                  <span className="flex-1"><span className="block text-sm font-bold text-gray-900">Trakbin wallet</span><span className="block text-xs font-semibold text-gray-500">Balance {formatNaira(walletBalance)}</span></span>
                  {autopaySource === 'wallet' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                </button>
                <button onClick={() => setAutopaySource('card')} className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${autopaySource === 'card' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700"><CreditCard className="h-5 w-5" /></span>
                  <span className="flex-1"><span className="block text-sm font-bold text-gray-900">Saved card / bank</span><span className="block text-xs font-semibold text-gray-500">Charged when due</span></span>
                  {autopaySource === 'card' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                </button>
              </div>
              <div className="flex gap-3">
                {autopayOn && <button onClick={confirmDisableAutopay} disabled={saving} className="flex-1 rounded-xl bg-rose-50 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:opacity-50">Disable</button>}
                <button onClick={() => setShowAutopay(false)} disabled={saving} className={`${autopayOn ? '' : 'flex-1'} rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50`}>Cancel</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={confirmAutopay} disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none">{saving ? 'Saving…' : autopayOn ? 'Update' : 'Enable'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{label}</span>{children}</label>);
}
async function supabaseInsertMethod(data: any) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return supabase.from('payment_methods').insert([data]);
}