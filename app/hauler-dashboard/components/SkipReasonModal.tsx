"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useDriverSession } from '@/lib/store/useDriverSession';

const REASONS = ["Resident absent", "Locked gate", "Road blocked", "Construction", "Flooding", "Security issue", "Other"];

export default function SkipReasonModal() {
  const { showSkipModal, setShowSkipModal, skipStop } = useDriverSession();
  const [selectedReason, setSelectedReason] = useState('');

  const handleSubmit = () => {
    if (selectedReason) {
      skipStop(selectedReason);
      setSelectedReason('');
    }
  };

  return (
    <AnimatePresence>
      {showSkipModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSkipModal(false)}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase">Skip Stop</h3>
              <button onClick={() => setShowSkipModal(false)} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-4">Select a reason for skipping this collection:</p>
              <div className="space-y-2 mb-6">
                {REASONS.map((reason) => (
                  <button key={reason} onClick={() => setSelectedReason(reason)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedReason === reason ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-slate-800 hover:bg-slate-800 text-gray-300'}`}>
                    <span className="text-sm font-bold">{reason}</span>
                  </button>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={!selectedReason} className="w-full py-3 bg-orange-600 text-white font-black rounded-xl uppercase disabled:bg-slate-800 disabled:text-gray-500 hover:bg-orange-500 transition-all">Confirm Skip</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}