"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import {
  LogOut, Receipt, Wallet, CreditCard, Landmark, Plus, X, CheckCircle2, Clock,
  AlertCircle, ShieldCheck, ArrowUpRight, ArrowDownRight, Zap, Download, Lock,
  Activity, CalendarClock, Hash, Loader2, ArrowLeft, Sparkles, Radio,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { formatNaira } from '@/lib/utils/money';
import CheckoutSheet from './components/CheckoutSheet';
import AddBankSheet from './components/AddBankSheet';
import AutopaySheet from './components/AutopaySheet';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Tab = 'invoices' | 'history' | 'methods';
type CheckoutIntent = { mode: 'invoice' | 'topup'; invoiceId?: string; amount?: number; description?: string } | null;

function Counter({ value, prefix = '', duration = 1.1 }: { value: number; prefix?: string; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => prefix + Math.round(v).toLocaleString('en-NG'));
  useEffect(() => { const c = animate(mv, value, { duration, ease: EASE }); return () => c.stop(); }, [value, duration]);
  return <motion.span>{rounded}</motion.span>;
}

function relTime(iso?: string) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

// running balance per visible row, walked backwards from the live wallet balance.
// out[i] = balance AFTER rows[i]; correct for the whole visible (newest-first) window.
function runningBalances(rows: any[], current: number): number[] {
  const out: number[] = []; let after = current;
  for (const r of rows) {
    out.push(after);
    const g = Number(r.gross) || 0;
    after = r.type === 'topup' ? after - g : after + g; // undo this row's effect
  }
  return out;
}

const CARD_TONE: Record<string, { from: string; to: string; mark: string }> = {
  visa: { from: 'from-[#1a1f71]', to: 'to-[#2b3990]', mark: 'VISA' },
  mastercard: { from: 'from-[#7a1f1f]', to: 'to-[#b03a2e]', mark: 'mastercard' },
  card: { from: 'from-emerald-800', to: 'to-emerald-600', mark: 'CARD' },
};

const TABS: { id: Tab; label: string; Icon: typeof Receipt }[] = [
  { id: 'invoices', label: 'Invoices', Icon: Receipt },
  { id: 'history', label: 'History', Icon: Activity },
  { id: 'methods', label: 'Methods', Icon: CreditCard },
];

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className={`${mono.className} mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400`}>{label}</span>{children}</label>);
}

export default function PaymentPage() {
  const router = useRouter();
  const {
    building, invoices, paymentMethods, walletBalance, ledger, autopaySource,
    companyProfile, loading, initializeSession, teardownRealtime, logout, refreshAll,
    saveAutopay, disableAutopay, setAutopaySource,
  } = useCaretakerSession();

  const [tab, setTab] = useState<Tab>('invoices');
  const [checkout, setCheckout] = useState<CheckoutIntent>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAutopay, setShowAutopay] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { initializeSession(); return () => teardownRealtime(); }, []);

  // ── guard: NO hook below this line (rules-of-hooks; the crash we fixed) ──
  if (!building) return null;

  // derived (plain consts, recomputed per render — small arrays, no hook risk)
  const address = building.address || 'Unregistered address';
  const autopayOn = !!building?.autopay_enabled;
  const provider = companyProfile?.business_name || 'your waste provider';
  const unpaid = (invoices || []).filter((i) => i.status !== 'paid');
  const totalOutstanding = unpaid.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const oldest = unpaid.length ? unpaid.reduce((a, b) => (new Date(a.due_date) <= new Date(b.due_date) ? a : b)) : null;
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const isOverdue = unpaid.some((i) => new Date(i.due_date) < today0);
  const firstOfNext = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('en-NG', { month: 'long', day: 'numeric' }); })();
  const lastMove = ledger?.[0];
  const balances = runningBalances(ledger || [], walletBalance);

  const openInvoice = (inv: any) => setCheckout({ mode: 'invoice', invoiceId: String(inv.id), amount: Number(inv.amount), description: inv.description });
  const resetCard = () => { setCardNumber(''); setCardExpiry(''); setCardCvv(''); };
  const openReceipt = async (ref: { tx?: string; invoice?: string }) => {
    try {
      const params = new URLSearchParams({ view: 'customer', owner: building.custom_id, ...ref });
      const res = await fetch(`/api/receipts?${params.toString()}`);
      const json = await res.json();
      if (json.ok && json.receipt?.receipt_number) window.open(`/receipts/${json.receipt.receipt_number}`, '_blank');
      else alert('Receipt not available yet.');
    } catch { alert('Could not open receipt.'); }
  };
  const saveCard = async () => {
    const digits = cardNumber.replace(/[^\d]/g, '');
    if (digits.length < 12 || !building?.custom_id) return;
    setSaving(true);
    try {
      const brand = digits.startsWith('4') ? 'visa' : digits.startsWith('5') ? 'mastercard' : 'card';
      const res = await fetch('/api/payment-methods', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId: building.custom_id, instrumentType: 'card', provider: 'paystack', type: 'card', cardLast4: digits.slice(-4), cardBrand: brand, is_default: paymentMethods.length === 0 }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not save card');
      await refreshAll(); setShowCard(false); resetCard();
    } catch (e: any) { alert('Could not save card: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };

  return (
    <div className={`${body.className} relative min-h-screen bg-[#f6f7f6] text-gray-900`}>
      {/* ambient field */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-200/40 to-transparent" />
      </div>

      {/* top chrome */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="sticky top-0 z-40 border-b border-gray-200/70 bg-[#f6f7f6]/85 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => router.push('/caretaker-dashboard')} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-emerald-50 hover:text-emerald-600"><ArrowLeft size={20} /></motion.button>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200"><span className={`${display.className} text-lg font-extrabold text-white`}>T</span></div>
                <div className="leading-none">
                  <span className={`${display.className} block text-lg font-extrabold tracking-tight text-gray-900`}>Trakbin</span>
                  <span className={`${mono.className} block text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400`}>billing</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`${mono.className} hidden items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 ring-1 ring-gray-200 sm:flex`}><Lock className="h-3 w-3 text-emerald-500" /> secure</span>
              <motion.button whileTap={{ scale: 0.96 }} onClick={logout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ── OUTSTANDING CONSOLE — opens on the money, the characteristic fact ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative mb-6 overflow-hidden rounded-[26px] border border-emerald-200/70 bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20 sm:p-9">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 28px)' }} />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-emerald-300/40" initial={{ y: 0 }} animate={{ y: ['0%', '1100%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/70`}>{address}</p>
                <p className={`${mono.className} mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300/80`}><Hash className="h-3 w-3" /> {building.custom_id}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${unpaid.length === 0 ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30' : isOverdue ? 'bg-rose-400/15 text-rose-100 ring-rose-300/30' : 'bg-amber-400/15 text-amber-100 ring-amber-300/30'}`}>
                <span className="relative flex h-2 w-2">{unpaid.length > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'currentColor' }} />}<span className={`relative inline-flex h-2 w-2 rounded-full ${unpaid.length === 0 ? 'bg-emerald-300' : isOverdue ? 'bg-rose-300' : 'bg-amber-300'}`} /></span>
                {unpaid.length === 0 ? <><CheckCircle2 className="h-3.5 w-3.5" /> All clear</> : isOverdue ? <><AlertCircle className="h-3.5 w-3.5" /> Overdue</> : <><Clock className="h-3.5 w-3.5" /> {unpaid.length} open</>}
              </span>
            </div>

            <p className={`${mono.className} mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/70`}>Outstanding balance</p>
            <div className="mt-1 flex items-end gap-3">
              <motion.span key={totalOutstanding} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`${display.className} text-6xl font-extrabold leading-[0.9] tracking-tight tabular-nums sm:text-7xl`}><Counter value={totalOutstanding} prefix="₦" /></motion.span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-100/80">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              {unpaid.length === 0 ? 'No invoices owing right now' : oldest ? <>Next due {new Date(oldest.due_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} · pay by card, bank, USSD or wallet</> : '—'}
            </p>

            {/* live last-movement rail */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              <p className={`${mono.className} min-w-0 flex-1 truncate text-[11px] font-semibold text-emerald-100/70`}>
                {lastMove ? <>Last · <span className="text-emerald-50">{lastMove.type === 'topup' ? '+' : '−'}{formatNaira(Number(lastMove.gross) || 0)}</span> {lastMove.type === 'topup' ? 'top-up' : 'payment'} · {relTime(lastMove.created_at)}</> : 'No wallet movement yet'}
              </p>
              <Radio className="h-3.5 w-3.5 shrink-0 text-emerald-300/70" />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => oldest && openInvoice(oldest)} disabled={unpaid.length === 0} className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-extrabold text-emerald-700 shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-emerald-100/50 disabled:shadow-none">
                {unpaid.length === 0 ? <><CheckCircle2 className="h-5 w-5" /> Nothing to pay</> : <>Pay {formatNaira(oldest ? Number(oldest.amount) : 0)} now <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAutopay(true)} className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold ring-1 transition-all ${autopayOn ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30 hover:bg-emerald-400/25' : 'bg-white/5 text-emerald-100 ring-white/15 hover:bg-white/10'}`}><Zap className="h-4 w-4" /> {autopayOn ? 'Autopay on' : 'Set autopay'}</motion.button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-emerald-100/70">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Secured by Paystack</span>
              <span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-emerald-300" /> Receipt for every payment</span>
              {autopayOn && <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-emerald-300" /> Settles on the 1st</span>}
            </div>
          </div>
        </motion.section>

        {/* wallet + autopay */}
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, ease: EASE }} whileHover={{ y: -3 }} className="group relative overflow-hidden rounded-[22px] border border-emerald-300/40 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-200">
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-50/80`}><Wallet className="h-4 w-4" /> Wallet balance</p>
                <span className={`${mono.className} flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/20`}><motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-200" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.8, repeat: Infinity }} /> on‑platform</span>
              </div>
              <p className={`${display.className} mt-3 text-4xl font-extrabold tracking-tight tabular-nums`}><Counter value={walletBalance} prefix="₦" /></p>
              <p className="mt-1 text-xs font-medium text-emerald-50/80">Funds settle invoices automatically when autopay is on</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCheckout({ mode: 'topup' })} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-extrabold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add funds</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddBank(true)} className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-extrabold text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"><Landmark className="h-4 w-4" /> Link bank</motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: 0.06, ease: EASE }} whileHover={{ y: -3 }} className="rounded-[22px] border border-gray-200/80 bg-white p-6 shadow-sm transition-colors hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/80`}><ShieldCheck className="h-4 w-4" /> Autopay</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${autopayOn ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${autopayOn ? 'bg-emerald-500' : 'bg-gray-400'}`} /> {autopayOn ? 'Active' : 'Off'}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-500">{autopayOn ? <>We settle each invoice on the <span className="font-bold text-gray-900">1st</span> from your <span className="font-bold text-gray-900">{autopaySource}</span>.</> : 'Turn on autopay and every invoice settles itself the moment it’s due — no overdue, no reminders.'}</p>
            {autopayOn && <div className="mt-3 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100"><span className={`${mono.className} text-xs font-bold uppercase tracking-wider text-gray-400`}>Next charge</span><span className="text-sm font-bold text-gray-900">{firstOfNext}</span></div>}
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAutopay(true)} className="mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100">{autopayOn ? 'Manage autopay' : 'Enable autopay'}</motion.button>
          </motion.div>
        </div>

        {/* segmented tabs */}
        <div className="relative mb-5 flex gap-1 rounded-2xl bg-gray-100 p-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors">
                {active && <motion.span layoutId="paytabseg" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                <span className={`relative z-10 flex items-center gap-2 ${active ? 'text-emerald-700' : 'text-gray-500'}`}><t.Icon className="h-4 w-4" /> {t.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE }}>

            {/* ── INVOICES ── */}
            {tab === 'invoices' && (
              <div className="space-y-4">
                {unpaid.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden rounded-[24px] border border-amber-200/70 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                      <h2 className={`${display.className} flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900`}><Receipt className="h-5 w-5 text-amber-500" /> Outstanding</h2>
                      <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-amber-600`}>{unpaid.length} open</span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {unpaid.map((inv, i) => (
                        <motion.li key={inv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }} className="group flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-amber-50/40">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{inv.description || 'Service invoice'}</p>
                            <p className={`${mono.className} mt-0.5 text-[11px] font-semibold text-gray-400`}>due {new Date(inv.due_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className={`${display.className} text-base font-extrabold tabular-nums text-gray-900`}>{formatNaira(inv.amount)}</span>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openInvoice(inv)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700">Pay</motion.button>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                    <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>All invoices</h2>
                    <span className={`${mono.className} text-[11px] font-bold uppercase tracking-wider text-gray-400`}>{invoices.length} total</span>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="relative px-6 py-16 text-center">
                      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><Receipt className="h-7 w-7 text-gray-300" /></div>
                      <p className="relative mt-4 text-sm font-bold text-gray-700">No invoices yet</p>
                      <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Your first invoice appears on your billing date. Until then, there’s nothing to pay.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {invoices.map((inv, i) => {
                        const paid = inv.status === 'paid';
                        const overdue = !paid && new Date(inv.due_date) < today0;
                        return (
                          <motion.li key={inv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.03, ease: EASE }} className="group relative flex items-center justify-between gap-3 overflow-hidden px-6 py-4 transition-colors hover:bg-gray-50/70">
                            <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-50/70 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                            <div className="relative flex items-center gap-3">
                              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${paid ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : overdue ? 'bg-rose-50 text-rose-600 ring-rose-100' : 'bg-amber-50 text-amber-600 ring-amber-100'}`}>{paid ? <CheckCircle2 className="h-5 w-5" /> : overdue ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}</span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-900">{inv.description || 'Service invoice'}</p>
                                <p className={`${mono.className} mt-0.5 text-[11px] font-semibold text-gray-400`}>{new Date(inv.due_date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="relative flex items-center gap-3">
                              <div className="text-right">
                                <p className={`${display.className} text-base font-extrabold tabular-nums text-gray-900`}>{formatNaira(inv.amount)}</p>
                                <p className={`${mono.className} text-[10px] font-bold uppercase tracking-wider ${paid ? 'text-emerald-600' : overdue ? 'text-rose-600' : 'text-amber-600'}`}>{paid ? 'paid' : overdue ? 'overdue' : 'unpaid'}</p>
                              </div>
                              {!paid ? (
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => openInvoice(inv)} className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700">Pay</motion.button>
                              ) : (
                                <button onClick={() => openReceipt({ invoice: String(inv.id) })} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100" title="Download receipt"><Download size={16} /></button>
                              )}
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>
              </div>
            )}

            {/* ── HISTORY — ledger with a running-balance column ── */}
            {tab === 'history' && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white p-7 shadow-sm sm:p-8">
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-50 blur-2xl" />
                <motion.span aria-hidden initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }} className="absolute inset-y-6 left-0 w-1 origin-top rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
                <div className="relative z-10 mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600/80`}><Receipt className="h-3.5 w-3.5" /> Statement</p>
                    <h3 className={`${display.className} mt-1 text-2xl font-extrabold tracking-tight text-gray-900`}>Payment history</h3>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-2.5 ring-1 ring-gray-100">
                    <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400`}>Wallet balance</p>
                    <p className={`${display.className} text-xl font-extrabold tabular-nums text-gray-900`}>{formatNaira(walletBalance)}</p>
                  </div>
                </div>

                {ledger.length === 0 ? (
                  <div className="relative z-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-12 text-center">
                    <Wallet className="mx-auto h-6 w-6 text-gray-300" />
                    <p className="mt-2 text-sm font-bold text-gray-700">No activity yet</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400">Top‑ups and payments appear here in order, with the running balance after each.</p>
                  </div>
                ) : (
                  <div className="relative z-10">
                    {/* column heads */}
                    <div className={`${mono.className} mb-1 hidden grid-cols-[1fr_auto_auto] items-center gap-4 px-1 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:grid`}>
                      <span>Entry</span><span className="text-right">Amount</span><span className="w-24 text-right">Balance</span>
                    </div>
                    <ol className="divide-y divide-gray-100">
                      {ledger.map((t, i) => {
                        const isTopup = t.type === 'topup';
                        const gross = Number(t.gross) || 0;
                        const bal = balances[i];
                        return (
                          <motion.li key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 + i * 0.03, ease: EASE }} className="group relative flex items-center gap-4 overflow-hidden py-4">
                            <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-50/60 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                            <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${isTopup ? 'bg-sky-50 text-sky-600 ring-sky-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'}`}>{isTopup ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}</span>
                            <div className="relative min-w-0 flex-1">
                              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">{isTopup ? 'Wallet top‑up' : 'Service payment'}<span className={`${mono.className} rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500`}>{t.status}</span></p>
                              <p className={`${mono.className} mt-0.5 truncate text-xs font-semibold text-gray-400`}>{isTopup ? 'Funds added to wallet' : `Invoice paid · ${provider}`} · {new Date(t.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <div className="relative flex items-center gap-3">
                              <button onClick={() => openReceipt({ tx: String(t.id) })} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100" title="Download receipt"><Download size={16} /></button>
                              <div className="text-right">
                                <p className={`${display.className} text-base font-extrabold tabular-nums ${isTopup ? 'text-sky-600' : 'text-gray-900'}`}>{isTopup ? '+' : '−'}{formatNaira(gross)}</p>
                                <p className={`${mono.className} hidden w-24 text-right text-[11px] font-bold tabular-nums text-gray-500 sm:block`}>{formatNaira(bal)}</p>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ol>
                  </div>
                )}
                <p className={`${mono.className} relative z-10 mt-5 flex items-center gap-2 text-xs font-medium text-gray-400`}><Activity className="h-3.5 w-3.5 text-emerald-500" /> Balanced & immutable · balance column reflects the shown window</p>
              </motion.section>
            )}

            {/* ── METHODS — a gallery of your own instruments ── */}
            {tab === 'methods' && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden rounded-[24px] border border-gray-200/80 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
                  <div>
                    <h2 className={`${display.className} text-lg font-extrabold tracking-tight text-gray-900`}>Payment methods</h2>
                    <p className={`${mono.className} mt-0.5 text-[11px] font-semibold text-gray-400`}>{paymentMethods.length} saved · cards charge on the secure page</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCard(true)} className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-gray-800"><CreditCard size={14} /> Card</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddBank(true)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700"><Landmark size={14} /> Bank</motion.button>
                  </div>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="relative px-6 py-16 text-center">
                    <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200"><CreditCard className="h-7 w-7 text-gray-300" /></div>
                    <p className="relative mt-4 text-sm font-bold text-gray-700">No methods yet</p>
                    <p className="relative mx-auto mt-1 max-w-xs text-xs text-gray-400">Add a card for quick pay, or link a verified bank to fund your wallet in one tap.</p>
                    <div className="relative mt-4 flex justify-center gap-2">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowCard(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"><CreditCard size={15} /> Add card</motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowAddBank(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700"><Landmark size={15} /> Link bank</motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                    {paymentMethods.map((m: any, i: number) => {
                      const isBank = m.instrument_type === 'bank_account' || m.type === 'bank';
                      const last4 = m.account_last4 || (m.account_number ? '••••' : '');
                      if (isBank) {
                        return (
                          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }} whileHover={{ y: -4 }} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
                            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-50 blur-2xl" />
                            <div className="relative flex items-start justify-between">
                              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-transform group-hover:scale-105"><Landmark className="h-5 w-5" /></span>
                              <span className={`${mono.className} inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200`}><CheckCircle2 className="h-2.5 w-2.5" /> verified</span>
                            </div>
                            <p className="relative mt-4 text-sm font-extrabold text-gray-900">{m.bank_name || 'Bank account'}</p>
                            <p className={`${mono.className} relative mt-0.5 text-sm font-bold tabular-nums text-gray-700`}>•••• {last4}</p>
                            <p className="relative mt-2 truncate text-xs font-semibold text-gray-500">{m.account_name}</p>
                            <p className={`${mono.className} relative mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400`}>Bank transfer · autopay source</p>
                          </motion.div>
                        );
                      }
                      const tone = CARD_TONE[(m.card_brand || 'card').toLowerCase()] || CARD_TONE.card;
                      return (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }} whileHover={{ y: -4, rotate: -0.6 }} className={`group relative aspect-[1.6/1] overflow-hidden rounded-2xl bg-gradient-to-br ${tone.from} ${tone.to} p-5 text-white shadow-lg shadow-emerald-900/10`}>
                          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.6) 0 1px, transparent 1px 22px)' }} />
                          <div aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                          <div className="relative flex h-full flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <span className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 ring-1 ring-white/30" />
                              <span className={`${display.className} text-sm font-black uppercase tracking-wide text-white/90`}>{tone.mark}</span>
                            </div>
                            <div>
                              <p className={`${mono.className} text-lg font-bold tracking-[0.18em] tabular-nums`}>•••• {m.card_last_four || '••••'}</p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Credit / debit</span>
                                {m.is_default && <span className={`${mono.className} rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-white/20`}>default</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* add-more tiles */}
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowCard(true)} className="flex aspect-[1.6/1] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-600">
                      <Plus className="h-6 w-6" /><span className="text-xs font-bold">Add card</span>
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowAddBank(true)} className="flex aspect-[1.6/1] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-600">
                      <Landmark className="h-6 w-6" /><span className="text-xs font-bold">Link bank</span>
                    </motion.button>
                  </div>
                )}
              </motion.section>
            )}

          </motion.div>
        </AnimatePresence>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 pt-6">
          <span className="flex items-center gap-2 text-xs font-semibold text-gray-500"><Lock className="h-3.5 w-3.5 text-emerald-500" /> Your card details never touch Trakbin · secured by Paystack</span>
          <span className={`${mono.className} flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400`}><Activity className="h-3.5 w-3.5 text-emerald-500" /> Trakbin Billing</span>
        </motion.footer>
      </main>

      {/* card-only inline modal (bank linking is owned by AddBankSheet) */}
      <AnimatePresence>
        {showCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !saving && setShowCard(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className={`${display.className} text-xl font-extrabold tracking-tight text-gray-900`}>Add card</h3>
                <button onClick={() => !saving && (setShowCard(false), resetCard())} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
              </div>
              {/* live card preview */}
              <div className="mb-5 aspect-[1.7/1] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-900/20">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 ring-1 ring-white/30" />
                    <Sparkles className="h-4 w-4 text-white/70" />
                  </div>
                  <p className={`${mono.className} text-lg font-bold tracking-[0.18em] tabular-nums`}>{cardNumber.replace(/[^\d]/g, '').slice(-4).padStart(4, '•') || '••••'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Field label="Card number"><input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" placeholder="4242 4242 4242 4242" className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry"><input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" className={inputCls} /></Field>
                  <Field label="CVV"><input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} inputMode="numeric" placeholder="123" className={inputCls} /></Field>
                </div>
              </div>
              <p className={`${mono.className} mt-3 flex items-center gap-2 text-[11px] font-medium text-gray-400`}><Lock className="h-3.5 w-3.5" /> We keep the last 4 digits & brand; the full card is tokenized by Paystack on the secure page</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => { setShowCard(false); resetCard(); }} disabled={saving} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={saveCard} disabled={saving || cardNumber.replace(/[^\d]/g, '').length < 12} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none">{saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Save card'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* autopay modal */}
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
                {autopayOn && <button onClick={async () => { setSaving(true); await disableAutopay(); setSaving(false); setShowAutopay(false); }} disabled={saving} className="flex-1 rounded-xl bg-rose-50 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:opacity-50">Disable</button>}
                <button onClick={() => setShowAutopay(false)} disabled={saving} className={`${autopayOn ? '' : 'flex-1'} rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50`}>Cancel</button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={async () => { setSaving(true); await saveAutopay(); setSaving(false); setShowAutopay(false); }} disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none">{saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : autopayOn ? 'Update' : 'Enable'}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* shared sheets */}
      <CheckoutSheet open={!!checkout} mode={checkout?.mode ?? 'topup'} invoiceId={checkout?.invoiceId} amount={checkout?.amount} description={checkout?.description} onClose={() => setCheckout(null)} onLinkBank={() => { setCheckout(null); setShowAddBank(true); }} />
      <AddBankSheet open={showAddBank} onClose={() => setShowAddBank(false)} />
      <AutopaySheet open={showAutopay} onClose={() => setShowAutopay(false)} onLinkBank={() => { setShowAutopay(false); setShowAddBank(true); }} />
    </div>
  );
}