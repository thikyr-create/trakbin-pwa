"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Printer, ArrowLeft, ShieldCheck, CircleCheck, Download } from 'lucide-react';
import { formatNaira, bpsToPercent } from '@/lib/utils/money';

const display = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' });
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Actor = { view: 'customer' | 'operator' | 'admin'; owner: string } | null;

function readActor(): Actor {
  if (typeof window === 'undefined') return null;
  const adminFlag = window.localStorage.getItem('trakbin_admin') === '1';
  const c = window.localStorage.getItem('trakbin_caretaker');
  const co = window.localStorage.getItem('trakbin_company');
  if (adminFlag && co) { try { const p = JSON.parse(co); return { view: 'admin', owner: String(p.company_id || p.id || '') }; } catch {} }
  if (c) { try { const p = JSON.parse(c); return { view: 'customer', owner: String(p.custom_id) }; } catch {} }
  if (co) { try { const p = JSON.parse(co); return { view: 'operator', owner: String(p.company_id || p.id || '') }; } catch {} }
  if (adminFlag) return { view: 'admin', owner: '' };
  return null;
}

// a barcode struck from the receipt number — varying-width vertical bars
function barcodeStyle(seed: string): React.CSSProperties {
  const bars: string[] = []; let pos = 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    const w1 = (c % 3) + 1; const w2 = ((c >> 1) % 2) + 1;
    bars.push(`#111 ${pos}px ${pos + w1}px`); pos += w1;
    bars.push(`transparent ${pos}px ${pos + w2}px`); pos += w2;
  }
  return { backgroundImage: `linear-gradient(to right, ${bars.join(',')})`, backgroundSize: `${pos}px 100%`, width: `${pos}px` };
}

const PRINT_CSS = `
  @media print {
    @page { size: A4; margin: 14mm; }
    body { background: #fff !important; }
    .no-print { display: none !important; }
    .receipt-shell { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; }
    .ambient { display: none !important; }
    .paid-stamp { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export default function ReceiptPage() {
  const params = useParams();
  const number = String(params.number || '');
  const [receipt, setReceipt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied' | 'missing'>('loading');
  const actor = useMemo(readActor, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!actor) { if (alive) setStatus('denied'); return; }
      try {
        const q = new URLSearchParams({ number, view: actor.view, owner: actor.owner });
        const res = await fetch(`/api/receipts?${q.toString()}`);
        const json = await res.json();
        if (!alive) return;
        if (res.status === 403) setStatus('denied');
        else if (!json.ok) setStatus('missing');
        else { setReceipt(json.receipt); setStatus('ok'); }
      } catch { if (alive) setStatus('missing'); }
    })();
    return () => { alive = false; };
  }, [number, actor]);

  const isCustomer = actor?.view === 'customer';
  const lines: { label: string; amount: number }[] = receipt?.line_items || [];

  return (
    <div className={`${body.className} relative min-h-screen bg-[#0c1411] text-gray-900`}>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      {/* ambient field */}
      <div aria-hidden className="ambient pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* toolbar */}
      <div className="no-print relative z-20 mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
        <button onClick={() => window.close()} className="flex items-center gap-2 rounded-xl bg-white/5 px-3.5 py-2 text-sm font-bold text-emerald-100 ring-1 ring-white/10 transition-colors hover:bg-white/10"><ArrowLeft size={16} /> Back</button>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70 ring-1 ring-white/10 sm:flex"><ShieldCheck className="h-3.5 w-3.5" /> Verified ledger entry</span>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-extrabold text-emerald-950 shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-400"><Download size={16} /> Download PDF</button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-16">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-24">
            <motion.div className="h-12 w-12 rounded-full border-b-2 border-emerald-400" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/60">Fetching receipt</p>
          </div>
        )}
        {status === 'denied' && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-emerald-50">
            <ShieldCheck className="mx-auto h-8 w-8 text-amber-300" />
            <p className="mt-3 text-lg font-extrabold">Sign in to view this receipt</p>
            <p className="mt-1 text-sm text-emerald-100/70">Receipts are private to the building or operator they belong to.</p>
          </div>
        )}
        {status === 'missing' && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-emerald-50">
            <p className="text-lg font-extrabold">Receipt not found</p>
            <p className="mt-1 text-sm text-emerald-100/70">No receipt exists for <span className={mono.className}>{number}</span>.</p>
          </div>
        )}

        {status === 'ok' && receipt && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} className="receipt-shell relative mx-auto max-w-md overflow-hidden rounded-[20px] bg-[#fbfaf6] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]">
            {/* perforated top edge */}
            <div aria-hidden className="h-3 w-full" style={{ backgroundImage: 'radial-gradient(circle at 8px 0, transparent 5px, #fbfaf6 6px)', backgroundSize: '16px 12px', backgroundPosition: '0 0' }} />

            <div className="relative px-7 pb-2 pt-1">
              {/* faint watermark */}
              <span aria-hidden className={`${display.className} pointer-events-none absolute right-4 top-10 select-none text-[120px] font-black leading-none text-emerald-900/[0.04]`}>T</span>

              {/* masthead */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700"><span className={`${display.className} text-lg font-black text-white`}>T</span></div>
                  <div>
                    <p className={`${display.className} text-lg font-black leading-none tracking-tight text-gray-900`}>Trakbin</p>
                    <p className={`${mono.className} mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400`}>Waste operations platform</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400`}>Receipt</p>
                  <p className={`${mono.className} mt-0.5 text-[11px] font-extrabold tracking-tight text-gray-900`}>{receipt.receipt_number}</p>
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-gray-300" />

              {/* meta grid */}
              <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                <div>
                  <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400`}>Issued</p>
                  <p className="mt-0.5 font-bold text-gray-900">{new Date(receipt.issued_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className={`${mono.className} text-[10px] font-semibold text-gray-400`}>{new Date(receipt.issued_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400`}>Type</p>
                  <p className="mt-0.5 font-bold text-gray-900">{receipt.purpose === 'topup' ? 'Wallet top‑up' : 'Service payment'}</p>
                </div>
                <div className="col-span-2">
                  <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400`}>{isCustomer ? 'Billed to' : 'Customer building'}</p>
                  <p className="mt-0.5 font-bold leading-snug text-gray-900">{receipt.building_address || '—'}</p>
                </div>
                {!isCustomer && (
                  <div className="col-span-2">
                    <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400`}>Service provider</p>
                    <p className="mt-0.5 font-bold text-gray-900">{receipt.provider_name || '—'}</p>
                  </div>
                )}
                {isCustomer && receipt.provider_name && (
                  <div className="col-span-2">
                    <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400`}>Service provided by</p>
                    <p className="mt-0.5 font-bold text-gray-900">{receipt.provider_name}</p>
                  </div>
                )}
              </div>

              <div className="my-4 border-t border-dashed border-gray-300" />

              {/* line items with dotted leaders */}
              <div className={`${mono.className} space-y-2 text-[12px]`}>
                {lines.map((l, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="font-semibold text-gray-800">{l.label}</span>
                    <span className="mb-1 flex-1 border-b border-dotted border-gray-300" />
                    <span className="font-bold tabular-nums text-gray-900">{formatNaira(l.amount)}</span>
                  </div>
                ))}
              </div>

              {/* operator-only fee breakdown */}
              {!isCustomer && (
                <div className={`${mono.className} mt-3 space-y-1.5 border-t border-gray-200 pt-3 text-[11px]`}>
                  <div className="flex justify-between text-gray-500"><span>Platform fee ({receipt.fee_model === 'flat' ? 'flat' : bpsToPercent(receipt.commission_bps)})</span><span className="tabular-nums text-gray-700">{formatNaira(receipt.commission)}</span></div>
                  <div className="flex justify-between font-bold text-emerald-700"><span>Net to you</span><span className="tabular-nums">{formatNaira(receipt.net)}</span></div>
                </div>
              )}

              <div className="my-4 border-t border-dashed border-gray-300" />

              {/* total */}
              <div className="flex items-end justify-between">
                <span className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500`}>{isCustomer ? 'Amount paid' : 'Gross settled'}</span>
                <span className={`${display.className} text-3xl font-black tabular-nums tracking-tight text-gray-900`}>{formatNaira(receipt.gross)}</span>
              </div>

              {/* PAID seal */}
              <div className="relative my-5 flex justify-center">
                <motion.div
                  initial={{ scale: 2.2, opacity: 0, rotate: -24 }}
                  animate={{ scale: 1, opacity: 1, rotate: -12 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.25 }}
                  className="paid-stamp flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-emerald-600 text-emerald-700"
                  style={{ boxShadow: 'inset 0 0 0 2px #fbfaf6, inset 0 0 0 4px rgba(5,150,105,0.5)' }}
                >
                  <div className="flex flex-col items-center leading-none">
                    <CircleCheck className="h-5 w-5" />
                    <span className={`${display.className} mt-0.5 text-[13px] font-black uppercase tracking-[0.12em]`}>Paid</span>
                  </div>
                </motion.div>
              </div>

              {/* barcode */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-full overflow-hidden opacity-80" style={barcodeStyle(receipt.receipt_number)} />
                <p className={`${mono.className} text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400`}>{receipt.receipt_number}</p>
              </div>

              <div className="my-4 border-t border-dashed border-gray-300" />

              <p className={`${mono.className} text-center text-[9px] leading-relaxed text-gray-400`}>
                This is a computer‑generated receipt and requires no signature.<br />
                {isCustomer
                  ? 'Thank you for keeping your community clean.'
                  : `Settlement reconciled against the Trakbin ledger · fee ${bpsToPercent(receipt.commission_bps)}.`}
              </p>
            </div>

            {/* perforated bottom edge */}
            <div aria-hidden className="h-3 w-full" style={{ backgroundImage: 'radial-gradient(circle at 8px 12px, transparent 5px, #fbfaf6 6px)', backgroundSize: '16px 12px' }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}