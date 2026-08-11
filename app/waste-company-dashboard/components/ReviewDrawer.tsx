"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Building2, Clock, CircleCheck, Calendar, Truck, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

export default function ReviewDrawer() {
  const { isDrawerOpen, setIsDrawerOpen, selectedRequest, activateService, serviceRequests } = useCompanySession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Wizard State
  const [selectedZone, setSelectedZone] = useState('Zone A'); // Mock zones for MVP
  const [frequency, setFrequency] = useState('Twice Weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState('08:00 AM - 11:00 AM');

  if (!isDrawerOpen || !selectedRequest) return null;

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleActivate = async () => {
    setLoading(true);
    await activateService(selectedRequest.id, selectedZone, {
      frequency,
      days: selectedDays,
      timeWindow
    });
    setLoading(false);
    setStep(1); // Reset for next time
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsDrawerOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Assignment Wizard</h2>
            <p className="text-sm font-bold text-gray-500">Step {step} of 4</p>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Review Building Details</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div><p className="text-xs font-bold text-gray-500 uppercase">Address</p><p className="text-sm font-bold text-gray-900">{selectedRequest.buildings?.address}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div><p className="text-xs font-bold text-gray-500 uppercase">GPS</p><p className="text-sm font-bold text-gray-900">{selectedRequest.buildings?.latitude?.toFixed(4)}, {selectedRequest.buildings?.longitude?.toFixed(4)}</p></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-800">Estimated Activation Time</p>
                    <p className="text-sm font-bold text-blue-900">Within 24 hours of approval</p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Assign Operational Zone</h3>
                  <div className="space-y-3">
                    {['Zone A', 'Zone B', 'Zone C'].map((zone) => (
                      <button key={zone} onClick={() => setSelectedZone(zone)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedZone === zone ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                        <p className="font-bold text-gray-900">{zone}</p>
                        <p className="text-xs text-gray-500">317 Buildings • 8 Drivers • 4 Trucks</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900">Assign Schedule Template</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Frequency</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Daily', 'Weekly', 'Twice Weekly', 'Monthly'].map(f => (
                        <button key={f} onClick={() => setFrequency(f)} className={`p-3 rounded-lg text-sm font-bold border-2 ${frequency === f ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pickup Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                        <button key={d} onClick={() => toggleDay(d)} className={`px-4 py-2 rounded-full text-xs font-bold ${selectedDays.includes(d) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Time Window</label>
                    <input type="text" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CircleCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Ready to Activate?</h3>
                    <p className="text-sm text-gray-500 mt-2">This will provision the caretaker's dashboard and enable route generation.</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Zone:</span><span className="font-bold">{selectedZone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Frequency:</span><span className="font-bold">{frequency}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Days:</span><span className="font-bold">{selectedDays.join(', ') || 'None'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Time:</span><span className="font-bold">{timeWindow}</span></div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2">
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <button onClick={handleActivate} disabled={loading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2">
              {loading ? 'Activating...' : 'Activate Service'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}