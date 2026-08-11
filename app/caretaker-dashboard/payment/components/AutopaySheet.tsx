"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { X, Wallet, CreditCard, Landmark, Zap, CircleCheck, Plus, ShieldCheck, Info } from 'lucide-react';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';
import { formatNaira } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props { open: boolean; onClose: () => void; onLinkBank: () => void; }

export default function AutopaySheet({ open, onClose, onLinkBank }: Props) {
  const { walletBalance, autopaySource, paymentMethods, saveAutopay, disableAutopay, building } = useCaretakerSession();
  const [source, setSource] = useState<'wallet' | 'card'>(autopaySource);
  const [saving, setSaving] = useState(false);

  const autopayOn = !!building?.autopay_enabled;
  const savedBanks = paymentMethods.filter((m: any) => m.instrument_type === 'bank_account');

  useEffect(() => {
    if (!open) return;
    setSource(autopaySource); setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const enable = async () => { setSaving(true); setSource('wallet'); await saveAutopay(); setSaving(false); onClose(); };
  const disable = async () => { setSaving(true); await disableAutopay(); setSaving(false); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={saving ? undefined : onClose}>
          <motion.div initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }} transition={{ duration: 0.32, ease: EASE }} onClick={(e) => e.stopPropagation()} className={`${body.className} relative w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]`}>
            <div className="relative overflow-hidden bg-emerald-950 px-6 pb-6 pt-5 text-white">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/70"><Zap className="h-3.5 w-3.5" /> Autopay</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-100/80">Settle every invoice automatically on the 1st</p>
                </div>
                <button onClick={onClose} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-100/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"><X size={18} /></button>
              </div>
            </div>

            <div className="max-h-[56vh] space-y-2.5 overflow-y-auto px-6 py-5">
              <button onClick={() => setSource('wallet')} className={`flex w-full items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-colors ${source === 'wallet' ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${source === 'wallet' ? 'bg-emerald-600 text-white ring-emerald-300/40' : 'bg-gray-50 text-gray-600 ring-gray-100'}`}><Wallet className="h-5 w-5" /></span>
                <span className="flex-1"><span className="block text-sm font-bold text-gray-900">Trakbin wallet</span><span className="block text-xs font-semibold text-gray-500">Balance {formatNaira(walletBalance)} · deducted on the 1st</span></span>
                {source === 'wallet' && <CircleCheck className="h-5 w-5 text-emerald-600" />}
              </button>

              <button onClick={() => setSource('card')} className={`flex w-full items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-colors ${source === 'card' ? 'border-emerald-500 bg-emerald-50/60' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${source === 'card' ? 'bg-emerald-600 text-white ring-emerald-300/40' : 'bg-gray-50 text-gray-600 ring-gray-100'}`}><CreditCard className="h-5 w-5" /></span>
                <span className="flex-1"><span className="block text-sm font-bold text-gray-900">Saved card</span><span className="block text-xs font-semibold text-gray-500">Charged when due</span></span>
                {source === 'card' && <CircleCheck className="h-5 w-5 text-emerald-600" />}
              </button>

              <div className="rounded-2xl border border-gray-200 p-3.5">
                <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"><Landmark className="h-3.5 w-3.5" /> Linked banks</p>
                {savedBanks.length === 0 ? (
                  <button onClick={onLinkBank} className="flex w-full items-center gap-2 rounded-xl px-1 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Link a bank account</button>
                ) : (
                  <div className="space-y-2">
                    {savedBanks.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
                        <Landmark className="h-4 w-4 text-gray-500" />
                        <span className="flex-1"><span className="block text-sm font-bold text-gray-900">{b.bank_name} •••• {b.account_last4}</span><span className="block text-xs font-semibold text-gray-500">{b.account_name}</span></span>
                      </div>
                    ))}
                    <button onClick={onLinkBank} className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-sm font-bold text-emerald-700 hover:bg-emerald-50"><Plus className="h-4 w-4" /> Add another</button>
                  </div>
                )}
                <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-gray-400"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Linked banks fund your wallet and get payment reminders. Automatic bank <span className="font-bold">pulls</span> aren’t supported by Nigerian rails yet — keep your wallet funded and autopay settles from it.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              <div className="flex gap-3">
                {autopayOn && <button onClick={disable} disabled={saving} className="flex-1 rounded-2xl bg-rose-50 py-3.5 text-sm font-bold text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:opacity-50">Disable</button>}
                <motion.button whileTap={{ scale: 0.98 }} onClick={enable} disabled={saving} className="flex-1 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:bg-gray-300 disabled:shadow-none">{saving ? 'Saving…' : autopayOn ? 'Update' : 'Enable autopay'}</motion.button>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> You can change or disable autopay anytime</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}