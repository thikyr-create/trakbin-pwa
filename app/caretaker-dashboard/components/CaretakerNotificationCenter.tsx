// app/caretaker-dashboard/components/CaretakerNotificationCenter.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Wrench, Zap, Receipt, X } from 'lucide-react';
import { useCaretakerNotifications, type CaretakerNotificationKind } from '@/lib/features/caretaker/notifications/useCaretakerNotifications';

const KIND_META: Record<CaretakerNotificationKind, { Icon: any; cls: string }> = {
  pickup: { Icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  pickup_disputed: { Icon: AlertTriangle, cls: 'bg-orange-50 text-orange-600 ring-orange-100' },
  issue_update: { Icon: Wrench, cls: 'bg-sky-50 text-sky-600 ring-sky-100' },
  service_activated: { Icon: Zap, cls: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  invoice_paid: { Icon: Receipt, cls: 'bg-violet-50 text-violet-600 ring-violet-100' },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

export default function CaretakerNotificationCenter() {
  const { items, unread, markSeen, disputePickup } = useCaretakerNotifications();
  const [open, setOpen] = useState(false);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open && unread > 0) markSeen(); }, [open, unread, markSeen]);

  const handleDispute = async (refId: string) => {
    setBusy(true);
    const res = await disputePickup(refId, note);
    setBusy(false);
    if (res.ok) { setDisputingId(null); setNote(''); }
    else alert('Could not submit dispute: ' + (res as any).error);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm transition hover:bg-gray-50"
      >
        <Bell size={18} className="text-gray-700" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:w-[360px]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-extrabold text-gray-900">Activity</p>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"><X size={16} /></button>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="mx-auto h-6 w-6 text-gray-300" />
                    <p className="mt-2 text-sm font-bold text-gray-700">No activity yet</p>
                    <p className="mt-1 text-xs text-gray-400">Pickups, reports, billing and service updates land here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {items.map((n) => {
                      const meta = KIND_META[n.kind];
                      const Icon = meta.Icon;
                      return (
                        <li key={n.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.cls}`}>
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="text-[13px] font-bold text-gray-900">{n.label}</p>
                                <span className="shrink-0 font-mono text-[10px] font-semibold text-gray-400">{timeAgo(n.at)}</span>
                              </div>
                              {n.sub && <p className="mt-0.5 truncate text-xs font-medium text-gray-500">{n.sub}</p>}

                              {n.kind === 'pickup' && !n.disputed && (
                                <button
                                  onClick={() => setDisputingId(n.refId)}
                                  className="mt-1.5 text-[11px] font-bold text-red-600 underline hover:text-red-800"
                                >
                                  Wasn't picked?
                                </button>
                              )}

                              {disputingId === n.refId && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-2">
                                  <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Optional: what did you observe?"
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDispute(n.refId!)}
                                      disabled={busy}
                                      className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:bg-gray-300"
                                    >
                                      {busy ? 'Submitting…' : 'Submit dispute'}
                                    </button>
                                    <button
                                      onClick={() => { setDisputingId(null); setNote(''); }}
                                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}