"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { CheckCircle2, AlertCircle, ArrowLeft, Wallet, Receipt, Radio } from 'lucide-react';
import { formatNaira } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Phase = 'checking' | 'success' | 'failed' | 'none';

// Ambient field shared by the fallback and the real body.
function AmbientField({ tone = 'emerald' as 'emerald' | 'rose' }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-[0.55]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.10) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
      <div className={`absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${tone === 'rose' ? 'bg-rose-200/40' : 'bg-emerald-200/40'}`} />
    </div>
  );
}

// Prerender/hydration shell — shown for the instant before the query params land.
function CallbackFallback() {
  return (
    <div className={`${body.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7f6] p-4 text-gray-900`}>
      <AmbientField />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <motion.div className="absolute inset-0 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ background: 'conic-gradient(from 0deg, rgba(110,231,183,0.5), transparent 40%)' }} />
          <div className="absolute inset-2 rounded-full border border-emerald-300/30" />
          <Radio className="relative h-7 w-7 text-emerald-600" />
        </div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">Confirming with your bank</p>
      </div>
    </div>
  );
}

function PaymentCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>('checking');
  const [amount, setAmount] = useState(0);
  const [purpose, setPurpose] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) { setPhase('none'); return; }

    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const json = await res.json();
        if (!alive) return;
        setAmount(Number(json.amount) || 0);
        setPurpose(String(json.purpose) || '');
        if (json.ok) setPhase('success');
        else { setReason(json.error || json.status || 'The payment did not go through.'); setPhase('failed'); }
      } catch {
        if (alive) { setReason('We couldn’t confirm the payment right now. Your bank will settle it shortly if it succeeded.'); setPhase('failed'); }
      }
    })();
    return () => { alive = false; };
  }, [params]);

  return (
    <div className={`${body.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7f6] p-4 text-gray-900`}>
      <AmbientField tone={phase === 'failed' ? 'rose' : 'emerald'} />

      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200/80 bg-white shadow-2xl">
        {/* console band */}
        <div className={`relative overflow-hidden p-7 text-white ${phase === 'failed' ? 'bg-rose-950' : 'bg-emerald-950'}`}>
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.5) 0 1px, transparent 1px 26px)' }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative z-10 flex items-center justify-center">
            {phase === 'checking' && (
              <div className="relative flex h-20 w-20 items-center justify-center">
                <motion.div className="absolute inset-0 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ background: 'conic-gradient(from 0deg, rgba(110,231,183,0.5), transparent 40%)' }} />
                <div className="absolute inset-2 rounded-full border border-white/15" />
                <Radio className="relative h-7 w-7 text-emerald-200" />
              </div>
            )}
            {phase === 'success' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 15 }} className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-400/20 ring-1 ring-emerald-300/40">
                <CheckCircle2 className="h-10 w-10 text-emerald-200" />
              </motion.div>
            )}
            {phase === 'failed' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 15 }} className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-400/20 ring-1 ring-rose-300/40">
                <AlertCircle className="h-10 w-10 text-rose-200" />
              </motion.div>
            )}
            {phase === 'none' && (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15"><AlertCircle className="h-10 w-10 text-white/70" /></div>
            )}
          </div>

          <p className="relative z-10 mt-5 text-center font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
            {phase === 'checking' ? 'Confirming with your bank' : phase === 'success' ? 'Payment received' : phase === 'failed' ? 'Not completed' : 'No payment found'}
          </p>
          {phase === 'success' && (
            <p className={`${display.className} relative z-10 mt-1 text-center text-5xl font-extrabold tracking-tight tabular-nums`}>{formatNaira(amount)}</p>
          )}
        </div>

        {/* detail */}
        <div className="px-7 py-6">
          {phase === 'checking' && <p className="text-center text-sm font-medium text-gray-500">This takes a few seconds. Don’t close this window.</p>}
          {phase === 'success' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-600">{purpose === 'topup' ? <Wallet className="h-4 w-4 text-emerald-600" /> : <Receipt className="h-4 w-4 text-emerald-600" />}{purpose === 'topup' ? 'Added to wallet' : 'Invoice paid'}</span>
                <span className="font-bold text-gray-900">{formatNaira(amount)}</span>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400">
                <motion.span className="h-1.5 w-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} /> Your dashboard is updating live
              </p>
            </div>
          )}
          {phase === 'failed' && <p className="text-center text-sm font-medium text-gray-500">{reason}</p>}
          {phase === 'none' && <p className="text-center text-sm font-medium text-gray-500">We didn’t receive a payment reference. If money left your account, it will reflect shortly — otherwise try again.</p>}

          <div className="mt-6 flex gap-3">
            {(phase === 'failed' || phase === 'none') && (
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push('/caretaker-dashboard/payment')} className="flex-1 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">Try again</motion.button>
            )}
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push('/caretaker-dashboard/payment')} className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-colors ${phase === 'success' ? 'w-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700' : 'flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {phase === 'success' ? 'Back to billing' : <><ArrowLeft className="h-4 w-4" /> Billing</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Default export: the real body under a Suspense boundary so Next can prerender
// the static shell while useSearchParams() resolves on the client.
export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <PaymentCallbackInner />
    </Suspense>
  );
}