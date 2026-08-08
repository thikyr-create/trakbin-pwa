"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDriverSession } from '@/lib/store/useDriverSession';

const ISSUE_TYPES = ["Blocked access", "Illegal dumping nearby", "Bin damaged", "Bin missing", "Wrong location", "Other"];

export default function DriverReportModal() {
  const { showReportModal, setShowReportModal, reportIssue, currentStop } = useDriverSession();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const close = () => {
    setShowReportModal(false);
    setSelectedType('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSaving(true);
    await reportIssue(selectedType, description.trim());
    setSaving(false);
    close();
  };

  return (
    <AnimatePresence>
      {showReportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400"><Flag size={16} /></span>
                <div>
                  <h3 className="text-lg font-black text-white uppercase">Report Issue</h3>
                  {currentStop && <p className="text-[10px] text-gray-500 font-bold">{currentStop.building_id}</p>}
                </div>
              </div>
              <button onClick={close} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-5">
              <div className="space-y-2 mb-4">
                {ISSUE_TYPES.map((t, i) => (
                  <motion.button
                    key={t}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(t)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedType === t ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-800 hover:bg-slate-800 text-gray-300'}`}
                  >
                    <span className="text-sm font-bold">{t}</span>
                  </motion.button>
                ))}
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional details…"
                className="w-full mb-4 rounded-xl border border-slate-800 bg-slate-800/50 p-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-red-500"
              />

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!selectedType || saving}
                className="w-full py-3 bg-red-600 text-white font-black rounded-xl uppercase disabled:bg-slate-800 disabled:text-gray-500 hover:bg-red-500 transition-all flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Submit Report
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}