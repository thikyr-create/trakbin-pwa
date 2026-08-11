"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Search, Check, ChevronDown, Loader2, CircleCheck, CircleX, Landmark } from 'lucide-react';
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
}

export default function BankPicker({
  country, onCountryChange, bank, onBankChange,
  accountNumber, onAccountNumberChange, accountName, onAccountNameChange,
}: Props) {
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirError, setDirError] = useState('');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // verify lifecycle — owned here so the auto-trigger can cancel cleanly
  const [resolving, setResolving] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const seqRef = useRef(0);                 // latest-request-wins token
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = SUPPORTED_COUNTRIES.find((x) => x.iso === country) || DEFAULT_COUNTRY;
  const acct = accountNumber.replace(/[^\d]/g, '');
  const canResolve = !!bank && acct.length === 10;

  // directory fetch on country change
  useEffect(() => {
    let alive = true;
    setLoading(true); setDirError(''); setBanks([]); onBankChange(null);
    fetch(`/api/banks?country=${encodeURIComponent(c.iso)}&currency=${encodeURIComponent(c.currency)}`)
      .then((r) => r.json())
      .then((j) => { if (alive) { if (j.ok) setBanks(j.banks || []); else setDirError(j.error || 'Could not load banks'); } })
      .catch(() => { if (alive) setDirError('Could not load banks'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.iso]);

  // the actual name enquiry — shared by the auto-trigger and the manual button
  const doResolve = useCallback(async () => {
    if (!bank || acct.length !== 10) return;
    if (timerRef.current) clearTimeout(timerRef.current); // a manual tap cancels a pending auto
    const my = ++seqRef.current;
    setResolving(true); setVerifyError(''); onAccountNameChange(null);
    try {
      const res = await fetch(`/api/banks/resolve?country=${encodeURIComponent(country)}&bankCode=${encodeURIComponent(bank.code)}&account=${encodeURIComponent(acct)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not verify account');
      if (my !== seqRef.current) return;       // a newer request superseded this one
      onAccountNameChange(json.accountName);
    } catch (e: any) {
      if (my !== seqRef.current) return;
      setVerifyError(e?.message || 'Could not verify account');
      onAccountNameChange(null);
    } finally {
      if (my === seqRef.current) setResolving(false);
    }
  }, [bank, acct, country, onAccountNameChange]);

  // auto-verify: debounced, only on a complete number + a chosen bank
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (acct.length === 10 && bank) {
      timerRef.current = setTimeout(() => { doResolve(); }, 600);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [acct, bank?.code, doResolve]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q) || b.code.includes(q));
  }, [banks, query]);

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
                  {dirError && <p className="px-4 py-3 text-sm font-semibold text-rose-600">{dirError}</p>}
                  {!dirError && filtered.length === 0 && <p className="px-4 py-3 text-sm font-semibold text-gray-400">{loading ? 'Loading…' : 'No banks match'}</p>}
                  {filtered.map((b) => {
                    const sel = bank?.code === b.code;
                    return (
                      <button
                        key={b.code}
                        onClick={() => { onBankChange(b); onAccountNameChange(null); setVerifyError(''); setOpen(false); setQuery(''); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition-colors ${sel ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
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
        <input
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => { onAccountNumberChange(e.target.value); onAccountNameChange(null); setVerifyError(''); }}
          placeholder="0123456789"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
        />
        {acct.length > 0 && acct.length !== 10 && <p className="mt-1 text-[11px] font-semibold text-amber-600">Nigerian accounts are 10 digits.</p>}
      </div>

      {/* live status — verifying / verified / failed */}
      <AnimatePresence initial={false}>
        {resolving && (
          <motion.div key="verifying" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 ring-1 ring-gray-100">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Verifying account name…</span>
            <span className="ml-auto flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {accountName && !resolving && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CircleCheck className="h-4 w-4" />
              </motion.span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600/70">Account belongs to</p>
                <p className="truncate text-sm font-extrabold text-gray-900">{accountName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {verifyError && !resolving && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600"><CircleX className="h-3.5 w-3.5 shrink-0" /> {verifyError}</p>
      )}

      {/* manual override / re-check — auto-verify handles the happy path */}
      <motion.button
        whileTap={canResolve && !resolving ? { scale: 0.98 } : undefined}
        onClick={doResolve}
        disabled={!canResolve || resolving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-sm font-extrabold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {resolving ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
          : accountName ? <><CircleCheck className="h-4 w-4" /> Verified · re-check</>
          : <><Search className="h-4 w-4" /> Verify account name</>}
      </motion.button>
    </div>
  );
}