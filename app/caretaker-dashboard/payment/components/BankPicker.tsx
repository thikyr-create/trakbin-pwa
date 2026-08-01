"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Search, Check, ChevronDown, Loader2, CheckCircle2, XCircle, Landmark } from 'lucide-react';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '@/lib/payments/countries';
import type { BankInfo } from '@/lib/payments/types';

const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });

interface Props {
  country: string;
  onCountryChange: (iso: string) => void;
  bank: BankInfo | null;
  onBankChange: (b: BankInfo | null) => void;
  accountNumber: string;
  onAccountNumberChange: (v: string) => void;
  accountName: string | null;
  onAccountNameChange: (v: string | null) => void;
  resolving: boolean;
  onResolve: () => void;
}

export default function BankPicker({
  country, onCountryChange, bank, onBankChange,
  accountNumber, onAccountNumberChange, accountName, onAccountNameChange, resolving, onResolve,
}: Props) {
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const c = SUPPORTED_COUNTRIES.find((x) => x.iso === country) || DEFAULT_COUNTRY;

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setBanks([]); onBankChange(null);
    fetch(`/api/banks?country=${encodeURIComponent(c.iso)}&currency=${encodeURIComponent(c.currency)}`)
      .then((r) => r.json())
      .then((j) => { if (alive) { if (j.ok) setBanks(j.banks || []); else setError(j.error || 'Could not load banks'); } })
      .catch(() => { if (alive) setError('Could not load banks'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.iso]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q) || b.code.includes(q));
  }, [banks, query]);

  const acct = accountNumber.replace(/[^\d]/g, '');
  const canResolve = !!bank && acct.length === 10;

  return (
    <div className={`${body.className} space-y-3`}>
      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Country</label>
        <div className="grid grid-cols-3 gap-2">
          {SUPPORTED_COUNTRIES.map((x) => (
            <button key={x.iso} onClick={() => onCountryChange(x.iso)} className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all ${country === x.iso ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <span>{x.flag}</span> {x.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Bank</label>
        <div className="relative">
          <button onClick={() => setOpen((o) => !o)} disabled={loading} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 disabled:opacity-60">
            <span className="flex items-center gap-2 truncate">
              <Landmark className="h-4 w-4 shrink-0 text-gray-400" />
              {bank ? bank.name : loading ? 'Loading banks…' : 'Select your bank'}
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bank…" className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none" />
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {error && <p className="px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}
                  {!error && filtered.length === 0 && <p className="px-4 py-3 text-sm font-semibold text-gray-400">{loading ? 'Loading…' : 'No banks match'}</p>}
                  {filtered.map((b) => {
                    const sel = bank?.code === b.code;
                    return (
                      <button key={b.code} onClick={() => { onBankChange(b); setOpen(false); setQuery(''); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors ${sel ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <span>{b.name}</span>
                        {sel && <Check className="h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Account number</label>
        <input inputMode="numeric" value={accountNumber} onChange={(e) => { onAccountNumberChange(e.target.value); onAccountNameChange(null); }} placeholder="0123456789" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" />
        {acct.length > 0 && acct.length !== 10 && <p className="mt-1 text-[11px] font-semibold text-amber-600">Nigerian accounts are 10 digits.</p>}
      </div>

      <motion.button whileTap={canResolve && !resolving ? { scale: 0.98 } : undefined} onClick={onResolve} disabled={!canResolve || resolving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-sm font-extrabold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
        {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Verify account name
      </motion.button>

      <AnimatePresence>
        {accountName && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600/70">Account belongs to</p>
                <p className="truncate text-sm font-extrabold text-gray-900">{accountName}</p>
              </div>
            </div>
          </motion.div>
        )}
        {accountNumber && acct.length === 10 && bank && !accountName && !resolving && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400"><XCircle className="h-3.5 w-3.5" /> Verify the account name before saving.</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}