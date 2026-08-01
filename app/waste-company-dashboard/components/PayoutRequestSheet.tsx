"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { X, Landmark, Plus, AlertCircle, ShieldCheck, ArrowUpRight, Info } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { formatNaira } from '@/lib/utils/money';
import CompanyRecipientSheet from './CompanyRecipientSheet';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const MIN = 1000;

interface Props { open: boolean; onClose: () => void; }

export default function PayoutRequestSheet({ open, onClose }: Props) {
  const { earnings, recipients, requestPayout } = useCompanySession();
  const [amount, setAmount] = useState<number | ''>('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [key] = useState(() => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `pk-${Date.now()}-${Math.random().toString(36).slice(2)}`));

  const available = earnings?.available ?? 0;

  useEffect(() => {
    if (!open) return;
    setAmount(''); setRecipientId(recipients[0]?.id || ''); setSubmitting(false); setError(''); setDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amt = Number(amount) || 0;
  const pct = (p: number) => Math.min(available, Math.max(MIN, Math.floor((available * p) / 100)));
  const canSubmit = amt >= MIN && amt <= available && !!recipientId && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    const res = await requestPayout(amt, recipientId, key);
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.reason === 'insufficient_available' ? 'Not enough available balance.' : res.reason === 'below_minimum' ? `Minimum payout is ${formatNaira(res.minimum || MIN)}.` : 'Could not request payout.');
  };

  const recipient = useMemo(() => recipients.find((r: any) => r.id === recipientId), [recipients, recipientId]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1050] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={submitting ? undefined : onClose}>
            <motion.div initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }} transition={{ duration: 0.32, ease: EASE }} onClick={(e) => e.stopPropagation()} className={`${body.className} relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]`}>
              <div className="relative overflow-hidden bg-emerald-950 px-6 pb-6 pt-5 text-white">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/70"><ArrowUpRight className="h-3.5 w-3.5" /> Request payout</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-100/80">Available {formatNaira(available)}</p>
                  </div>
                  <button onClick={onClose} disabled={submitting} className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-100/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"><X size={18} /></button>
                </div>
              </div>

              <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
                {done ? (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><ShieldCheck className="h-8 w-8" /></motion.div>
                    <h3 className={`${display.className} mt-4 text-xl font-extrabold tracking-tight text-gray-900`}>Payout requested</h3>
                    <p className="mt-1 text-sm font-medium text-gray-500">{formatNaira(amt)} reserved and queued to {recipient?.bank_name} •••• {recipient?.account_last4}.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {/* staging honesty banner */}
                    <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <p className="text-[11px] font-semibold leading-relaxed text-amber-800"><span className="font-bold">Payout staging.</span> Requests reserve your funds and queue for processing; the bank transfer itself activates with the payouts rail release.</p>
                    </div>

                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-gray-400">₦</span>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" autoFocus className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-2xl font-extrabold tabular-nums text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((p) => (
                          <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => setAmount(pct(p))} className={`rounded-xl py-2 text-xs font-bold transition-all ${amt === pct(p) ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{p}%</motion.button>
                        ))}
                      </div>
                      {amt > 0 && amt < MIN && <p className="mt-1.5 text-[11px] font-semibold text-amber-600">Minimum payout is {formatNaira(MIN)}.</p>}
                      {amt > available && <p className="mt-1.5 text-[11px] font-semibold text-rose-600">Exceeds your available balance.</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Pay to</label>
                      {recipients.length === 0 ? (
                        <button onClick={() => setAddOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add a payout account</button>
                      ) : (
                        <div className="space-y-2">
                          {recipients.map((r: any) => {
                            const sel = recipientId === r.id;
                            return (
                              <button key={r.id} onClick={() => setRecipientId(r.id)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${sel ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 hover:border-gray-300'}`}>
                                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${sel ? 'bg-emerald-600 text-white ring-emerald-300/40' : 'bg-gray-50 text-gray-600 ring-gray-100'}`}><Landmark className="h-5 w-5" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-gray-900">{r.bank_name} •••• {r.account_last4}</span><span className="block truncate text-xs font-semibold text-gray-500">{r.account_name}</span></span>
                                {sel && <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />}
                              </button>
                            );
                          })}
                          <button onClick={() => setAddOpen(true)} className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-sm font-bold text-emerald-700 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add another account</button>
                        </div>
                      )}
                    </div>

                    {error && <p className="flex items-center gap-2 text-xs font-bold text-rose-600"><AlertCircle className="h-4 w-4" /> {error}</p>}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
                {done ? (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={onClose} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">Done</motion.button>
                ) : (
                  <motion.button whileTap={canSubmit ? { scale: 0.98 } : undefined} onClick={submit} disabled={!canSubmit} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">{submitting ? 'Requesting…' : `Request ${amt >= MIN ? formatNaira(amt) : 'payout'}`}</motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompanyRecipientSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}