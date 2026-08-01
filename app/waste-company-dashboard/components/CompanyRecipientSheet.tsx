"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { X, ShieldCheck, CheckCircle2, Landmark, AlertCircle } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';
import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES } from '@/lib/payments/countries';
import type { BankInfo } from '@/lib/payments/types';
// shared primitive — lives under the caretaker feature for now; promote to a
// shared @/components/banking home in a non-money cleanup pass (do NOT bundle
// that move with payout code).
import BankPicker from '../../caretaker-dashboard/payment/components/BankPicker';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Props { open: boolean; onClose: () => void; }

export default function CompanyRecipientSheet({ open, onClose }: Props) {
  const { saveRecipient } = useCompanySession();
  const [country, setCountry] = useState(DEFAULT_COUNTRY.iso);
  const [bank, setBank] = useState<BankInfo | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCountry(DEFAULT_COUNTRY.iso); setBank(null); setAccountNumber(''); setAccountName(null);
    setSaving(false); setError(''); setSaved(false);
  }, [open]);

  const digits = accountNumber.replace(/[^\d]/g, '');
  const canSave = !!bank && !!accountName && digits.length >= 8 && !saving;

  const save = async () => {
    if (!canSave || !bank) return;
    setSaving(true); setError('');
    const cur = SUPPORTED_COUNTRIES.find((c) => c.iso === country)?.currency || 'NGN';
    const res = await saveRecipient({ bankCode: bank.code, bankName: bank.name, accountNumber: digits, accountLast4: digits.slice(-4), accountName, country, currency: cur });
    setSaving(false);
    if (res.ok) setSaved(true); else setError(res.error || 'Could not save account');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={saving ? undefined : onClose}>
          <motion.div initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.98 }} transition={{ duration: 0.32, ease: EASE }} onClick={(e) => e.stopPropagation()} className={`${body.className} relative max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]`}>
            <div className="relative overflow-hidden bg-emerald-950 px-6 pb-6 pt-5 text-white">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200/70"><Landmark className="h-3.5 w-3.5" /> Payout account</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-100/80">Where your earnings are paid out</p>
                </div>
                <button onClick={onClose} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-full text-emerald-100/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"><X size={18} /></button>
              </div>
            </div>

            <div className="max-h-[56vh] overflow-y-auto px-6 py-5">
              {saved ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></motion.div>
                  <h3 className={`${display.className} mt-4 text-xl font-extrabold tracking-tight text-gray-900`}>Account saved</h3>
                  <p className="mt-1 text-sm font-medium text-gray-500">{bank?.name} •••• {digits.slice(-4)} is ready for payouts.</p>
                </motion.div>
              ) : (
                <>
                  <BankPicker country={country} onCountryChange={setCountry} bank={bank} onBankChange={setBank} accountNumber={accountNumber} onAccountNumberChange={setAccountNumber} accountName={accountName} onAccountNameChange={setAccountName} />
                  {error && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-600"><AlertCircle className="h-4 w-4" /> {error}</p>}
                </>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              {saved ? (
                <motion.button whileTap={{ scale: 0.98 }} onClick={onClose} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">Done</motion.button>
              ) : (
                <motion.button whileTap={canSave ? { scale: 0.98 } : undefined} onClick={save} disabled={!canSave} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">{saving ? 'Saving…' : 'Save payout account'}</motion.button>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> We store only the bank, last‑4 digits & verified name</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}