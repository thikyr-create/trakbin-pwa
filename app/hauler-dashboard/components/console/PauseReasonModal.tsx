// app/hauler-dashboard/components/console/PauseReasonModal.tsx
"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause } from 'lucide-react';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';

const REASONS = ['Truck full — disposal drop', 'Refuel', 'Break', 'Traffic', 'Vehicle issue', 'Other'];

export default function PauseReasonModal() {
  const { pauseModalOpen, setPauseModalOpen } = useConsoleStore();
  const { toggleRoutePause } = useDriverSession();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const close = () => { setPauseModalOpen(false); setReason(null); setNote(''); };

  const confirm = async () => {
    const finalReason = reason === 'Other' ? (note.trim() || 'Other') : (reason ?? undefined);
    await toggleRoutePause(finalReason);
    close();
  };

  return (
    <AnimatePresence>
      {pauseModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Pause size={18} className="text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Pause route?</h3>
                <p className="text-xs text-gray-500">Progress is preserved. Stops won't be marked late while paused.</p>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Reason (optional)</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(reason === r ? null : r)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    reason === r
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {(reason === 'Other' || note.length > 0) && (
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note…"
                className="w-full mb-3 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={close} className="py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm uppercase active:scale-95">
                Cancel
              </button>
              <button onClick={confirm} className="py-3 rounded-xl bg-amber-500 text-white font-bold text-sm uppercase active:scale-95">
                Pause Route
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}