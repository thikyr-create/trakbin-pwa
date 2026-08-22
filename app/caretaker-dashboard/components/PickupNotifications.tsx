// app/caretaker-dashboard/components/PickupNotifications.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, X, MessageSquare } from 'lucide-react';
import { useCaretakerPickupNotifications } from '@/lib/features/caretaker/notifications/useCaretakerPickupNotifications';

export default function PickupNotifications() {
  const { pickups, undisputedCount, loading, disputePickup } = useCaretakerPickupNotifications();
  const [open, setOpen] = useState(false);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handleDispute = async (stopId: string) => {
    const res = await disputePickup(stopId, note);
    if (res.ok) {
      setDisputingId(null);
      setNote('');
      alert('Dispute submitted. The waste company will be notified.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl bg-white p-3 shadow-sm border border-gray-200 hover:bg-gray-50 transition"
      >
        <Bell size={20} className="text-gray-700" />
        {undisputedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {undisputedCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">Recent Pickups</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && pickups.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">Loading...</p>
              ) : pickups.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">No recent pickups</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pickups.map((p) => (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {p.disputed ? (
                              <AlertTriangle size={14} className="text-orange-500" />
                            ) : (
                              <CheckCircle size={14} className="text-green-600" />
                            )}
                            <p className="text-xs font-bold text-gray-900">
                              {p.disputed ? 'Pickup Disputed' : 'Pickup Completed'}
                            </p>
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {new Date(p.completedAt).toLocaleString()}
                          </p>
                        </div>
                        {!p.disputed && (
                          <button
                            onClick={() => setDisputingId(p.id)}
                            className="text-[11px] font-bold text-red-600 hover:text-red-800"
                          >
                            Wasn't picked
                          </button>
                        )}
                      </div>

                      {disputingId === p.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 space-y-2"
                        >
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional: reason for dispute"
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDispute(p.id)}
                              disabled={loading}
                              className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:bg-gray-400"
                            >
                              {loading ? 'Submitting...' : 'Submit Dispute'}
                            </button>
                            <button
                              onClick={() => { setDisputingId(null); setNote(''); }}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}