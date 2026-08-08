"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Map } from 'lucide-react';
import { recordActivity } from '@/lib/features/driver/activity';
import { useDriverSession } from '@/lib/store/useDriverSession';
import { useCompanySession } from '@/lib/store/useCompanySession';

const REASONS = ["Road blocked", "Traffic", "Wrong turn", "Emergency", "Customer request", "Other"];

export default function DeviationAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [distanceM, setDistanceM] = useState(0);
  const [selectedReason, setSelectedReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setDistanceM(e.detail.distanceM);
      setShowAlert(true);
    };
    window.addEventListener('trakbin-deviation', handler as any);
    return () => window.removeEventListener('trakbin-deviation', handler as any);
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);

    const { driver, route } = useDriverSession.getState();
    const { tenant } = useCompanySession.getState();
    if (driver && route && tenant.companyId) {
      await recordActivity({
        eventType: 'DRIVER_FEEDBACK_SUBMITTED',
        driverId: driver.employee_id || driver.id,
        companyId: tenant.companyId,
        routeId: route.id,
        metadata: { category: 'route_deviation', reason: selectedReason },
      });
    }

    setSubmitting(false);
    setShowAlert(false);
    setSelectedReason('');
  };

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-800 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"><Map size={16} /></span>
                <h3 className="text-lg font-black text-white uppercase">Route Deviation</h3>
              </div>
              <button onClick={() => setShowAlert(false)} className="p-1 hover:bg-slate-800 rounded-full"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <AlertTriangle size={20} className="text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-400">Off-route detected</p>
                  <p className="text-xs text-gray-400 mt-1">You are ~{distanceM}m from the planned route. Reason?</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedReason(r)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedReason === r ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 hover:bg-slate-800 text-gray-300'}`}
                  >
                    <span className="text-sm font-bold">{r}</span>
                  </button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className="w-full py-3 bg-amber-600 text-white font-black rounded-xl uppercase disabled:bg-slate-800 disabled:text-gray-500 hover:bg-amber-500 transition-all"
              >
                {submitting ? 'Submitting...' : 'Confirm Reason'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}