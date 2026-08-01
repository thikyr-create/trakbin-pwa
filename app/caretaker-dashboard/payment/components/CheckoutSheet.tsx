"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import {
  X, CreditCard, Landmark, Smartphone, Wallet, Lock, ShieldCheck,
  ArrowRight, CheckCircle2, AlertCircle, Mail, Loader2, Sparkles, Plus,
} from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { PAYMENT_METHODS, type MethodMeta } from '@/lib/payments/methods';
import type { PaymentMethod } from '@/lib/payments/types';
import { formatNaira } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_KEY = 'trakbin_payer_email';

const ICONS: Record<PaymentMethod, typeof CreditCard> = {
  card: CreditCard, bank: Landmark, ussd: Smartphone, mobile_money: Smartphone, wallet: Wallet,
};
const FRIENDLY: Record<string, string> = {
  insufficient_wallet: 'Your wallet balance is too low for this.',
  invoice_already_paid: 'This invoice is already paid.',
  no_provider_assigned: 'No waste provider is assigned to this building yet.',
  invoice_not_found: 'We couldn’t find that invoice.',
  amount_mismatch: 'The amount changed — please try again.',
  bank_charge_not_confirmed: 'Your bank didn’t confirm the charge. Please try again.',
};

type Mode = 'invoice' | 'topup';
type Step = 'amount' | 'method' | 'processing' | 'done' | 'error';

interface Props {
  open: boolean;
  mode: Mode;
  invoiceId?: string;
  amount?: number;
  description?: string;
  onClose: () => void;
  onLinkBank: () => void;
}

export default function CheckoutSheet({ open, mode, invoiceId, amount, description, onClose, onLinkBank }: Props) {
  const { building, walletBalance, companyProfile, paymentMethods, payInvoice } = useCaretakerSession();

  const [step, setStep] = useState<Step>('method');
  const [entered, setEntered] = useState<number | ''>('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [bankMethodId, setBankMethodId] = useState<string>('hosted');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTest = (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '').startsWith('pk_test');
  const providerName = companyProfile?.business_name || 'your waste provider';
  const savedBanks = useMemo(() => paymentMethods.filter((m: any) => m.instrument_type === 'bank_account'), [paymentMethods]);

  useEffect(() => {
    if (!open) return;
    setStep(mode === 'topup' ? 'amount' : 'method');
    setEntered(mode === 'topup' ? '' : 0);
    setMethod(null); setBankMethodId('hosted');
    setEmail(typeof window !== 'undefined' ? localStorage.getItem(EMAIL_KEY) || '' : '');
    setLoading(false); setError('');
  }, [open, mode]);

  const effectiveAmount = mode === 'invoice' ? Number(amount) || 0 : Number(entered) || 0;
  const walletEnough = walletBalance >= effectiveAmount;

  const methods: MethodMeta[] = useMemo(() => {
    const base = PAYMENT_METHODS.filter((m) => m.id !== 'wallet');
    return mode === 'invoice' ? [...base, PAYMENT_METHODS.find((m) => m.id === 'wallet')!] : base;
  }, [mode]);

  const needsEmail = !!method && method !== 'wallet';
  const canContinue =
    step === 'amount' ? effectiveAmount > 0 :
    step === 'method' ? !!method && (!needsEmail || EMAIL_RE.test(email)) :
    false;

  const persistEmail = () => { if (EMAIL_RE.test(email) && typeof window !== 'undefined') localStorage.setItem(EMAIL_KEY, email); };

  const goExternal = async () => {
    if (!building?.custom_id) { setError('Session expired — please log in again.'); setStep('error'); return; }
    setLoading(true); setError('');
    try {
      // saved bank → server-side bank-account charge (no redirect)
      if (method === 'bank' && bankMethodId !== 'hosted') {
        const res = await fetch('/api/payments/fund-bank', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildingId: building.custom_id, methodId: bankMethodId, amount: effectiveAmount, email }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Could not charge your bank');
        persistEmail(); setStep('done'); setLoading(false); return;
      }
      // otherwise → Paystack hosted page
      const res = await fetch('/api/payments/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount, purpose: mode === 'invoice' ? 'invoice' : 'topup',
          invoiceId: mode === 'invoice' ? invoiceId : undefined, buildingId: building.custom_id,
          email, method, provider: 'paystack',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.authorizationUrl) throw new Error(json.error || 'Could not start payment');
      persistEmail();
      window.location.href = json.authorizationUrl;
    } catch (e: any) {
      setError(FRIENDLY[e?.message] || e?.message || 'Something went wrong.');
      setStep('error'); setLoading(false);
    }
  };

  const goWallet = async () => {
    if (mode !== 'invoice' || !invoiceId) return;
    setLoading(true); setError('');
    const res = await payInvoice(invoiceId);
    setLoading(false);
    if (res.ok) { persistEmail(); setStep('done'); }
    else { setError(FRIENDLY[res.reason || ''] || 'Could not settle from your wallet.'); setStep('error'); }
  };

  const onContinue = () => {
    if (step === 'amount') { setStep('method'); return; }
    if (method === 'wallet') goWallet(); else goExternal();
  };

  const heading = description || (mode === 'invoice' ? 'Service invoice' : 'Wallet top-up');

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={loading ? undefined : onClose}>
          <motion.div initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }} transition={{ duration: 0.32, ease: EASE }} onClick={(e) => e.stopPropagation()} className={`${body.className} relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]`}>
            <div className="relative overflow-hidden bg-emerald-950 px-6 pb-6 pt-5 text-white">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/70"><Lock className="h-3.5 w-3.5" /> Secure checkout</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-100/80">{heading}</p>
                </div>
                <button onClick={onClose} disabled={loading} className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-100/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"><X size={18} /></button>
              </div>
              {step !== 'done' && step !== 'error' && (
                <motion.p key={effectiveAmount} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`${display.className} relative z-10 mt-1 text-5xl font-extrabold leading-none tracking-tight tabular-nums`}>{formatNaira(effectiveAmount)}</motion.p>
              )}
              {mode === 'invoice' && step !== 'done' && step !== 'error' && <p className="relative z-10 mt-2 text-xs font-medium text-emerald-200/70">to {providerName}</p>}
            </div>

            <div className="max-h-[52vh] overflow-y-auto px-6 py-5">
              {isTest && (step === 'amount' || step === 'method') && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-[11px] font-semibold text-amber-800"><span className="font-bold">Test mode.</span> Use Paystack test cards (4084 0840 8408 4081 · any future expiry · OTP 123456).</p>
                </div>
              )}

              {step === 'amount' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Amount to add</label>
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-gray-400">₦</span>
                    <input type="number" value={entered} onChange={(e) => setEntered(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" autoFocus className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-2xl font-extrabold tabular-nums text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[5000, 10000, 20000, 50000].map((q) => (
                      <motion.button key={q} whileTap={{ scale: 0.95 }} onClick={() => setEntered(q)} className={`rounded-xl py-2.5 text-sm font-bold transition-all ${entered === q ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{formatNaira(q)}</motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'method' && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }} className="space-y-2.5">
                  <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Choose payment method</p>
                  {methods.map((m, i) => {
                    const Icon = ICONS[m.id];
                    const selected = method === m.id;
                    const disabled = m.id === 'wallet' && !walletEnough;
                    return (
                      <div key={m.id}>
                        <motion.button
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: i * 0.05, ease: EASE }}
                          whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: 0.99 }}
                          onClick={() => !disabled && setMethod(m.id)}
                          className={`relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border-2 p-3.5 text-left transition-colors ${selected ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 bg-white hover:border-gray-300'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {selected && <motion.span layoutId="chk-ring" className="absolute inset-0 -z-0 rounded-2xl ring-2 ring-emerald-500" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                          <span className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${selected ? 'bg-emerald-600 text-white ring-emerald-300/40' : 'bg-gray-50 text-gray-600 ring-gray-100'}`}><Icon className="h-5 w-5" /></span>
                          <span className="relative z-10 min-w-0 flex-1">
                            <span className="block text-sm font-bold text-gray-900">{m.label}</span>
                            <span className="block truncate text-xs font-semibold text-gray-500">{disabled ? `Insufficient · top up ${formatNaira(effectiveAmount - walletBalance)}` : m.hint}</span>
                          </span>
                          {selected && <CheckCircle2 className="relative z-10 h-5 w-5 shrink-0 text-emerald-600" />}
                        </motion.button>

                        {/* saved-bank sub-options for the Bank method */}
                        <AnimatePresence>
                          {m.id === 'bank' && selected && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
                              <div className="mt-2 space-y-2 rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-100">
                                <button onClick={() => setBankMethodId('hosted')} className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${bankMethodId === 'hosted' ? 'border-emerald-500 bg-white' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                  <Landmark className="h-4 w-4 text-gray-500" />
                                  <span className="flex-1"><span className="block text-sm font-bold text-gray-900">One‑off bank transfer</span><span className="block text-xs font-semibold text-gray-500">Approve on your bank’s secure page</span></span>
                                  {bankMethodId === 'hosted' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                </button>
                                {savedBanks.map((b: any) => (
                                  <button key={b.id} onClick={() => setBankMethodId(b.id)} className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${bankMethodId === b.id ? 'border-emerald-500 bg-white' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                    <Landmark className="h-4 w-4 text-gray-500" />
                                    <span className="flex-1"><span className="block text-sm font-bold text-gray-900">{b.bank_name} •••• {b.account_last4}</span><span className="block text-xs font-semibold text-gray-500">{b.account_name}</span></span>
                                    {bankMethodId === b.id && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                  </button>
                                ))}
                                <button onClick={onLinkBank} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"><Plus className="h-4 w-4" /> Link a bank account</button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  <AnimatePresence>
                    {needsEmail && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden pt-1">
                        <label className="mb-1.5 mt-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><Mail className="h-3 w-3" /> Email for receipt</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <motion.div className="h-12 w-12 rounded-full border-b-2 border-emerald-600" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                  <p className="text-sm font-bold text-gray-700">{method === 'wallet' ? 'Settling from wallet…' : method === 'bank' && bankMethodId !== 'hosted' ? 'Charging your bank…' : 'Opening secure payment page…'}</p>
                </div>
              )}

              {step === 'done' && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></motion.div>
                  <h3 className={`${display.className} mt-4 text-xl font-extrabold tracking-tight text-gray-900`}>Payment successful</h3>
                  <p className="mt-1 text-sm font-medium text-gray-500">{formatNaira(effectiveAmount)} {mode === 'invoice' ? 'paid' : 'added to your wallet'}.</p>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><AlertCircle className="h-8 w-8" /></div>
                  <h3 className={`${display.className} mt-4 text-xl font-extrabold tracking-tight text-gray-900`}>Couldn’t complete</h3>
                  <p className="mx-auto mt-1 max-w-xs text-sm font-medium text-gray-500">{error}</p>
                </motion.div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              {(step === 'amount' || step === 'method') && (
                <motion.button whileTap={canContinue && !loading ? { scale: 0.98 } : undefined} onClick={onContinue} disabled={!canContinue || loading} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : step === 'amount' ? 'Continue' : method === 'wallet' ? `Pay ${formatNaira(effectiveAmount)} from wallet` : `Continue with ${methods.find((m) => m.id === method)?.label.split(' ')[0] || 'payment'}`}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </motion.button>
              )}
              {step === 'done' && <motion.button whileTap={{ scale: 0.98 }} onClick={onClose} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">Done</motion.button>}
              {step === 'error' && (
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 rounded-2xl bg-gray-200 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-300">Close</button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(method ? 'method' : 'amount')} className="flex-1 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">Try again</motion.button>
                </div>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secured by Paystack · your card details never touch Trakbin</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}