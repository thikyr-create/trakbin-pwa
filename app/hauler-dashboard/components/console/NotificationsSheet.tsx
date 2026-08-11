// app/hauler-dashboard/components/console/NotificationsSheet.tsx
"use client";

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X, Flag, Route } from 'lucide-react';
import { useConsoleStore } from '@/lib/features/driver-console/store/consoleStore';
import { useDriverNotifications } from '@/lib/features/driver-console/hooks/useDriverNotifications';

export default function NotificationsSheet() {
  const { notifOpen, setNotifOpen, setActiveTab } = useConsoleStore();
  const { items, markSeen } = useDriverNotifications();

  // Opening = seen
  useEffect(() => {
    if (notifOpen) markSeen();
  }, [notifOpen, markSeen]);

  return (
    <AnimatePresence>
      {notifOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setNotifOpen(false)}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-black text-gray-900">Notifications</h3>
              <button onClick={() => setNotifOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Bell size={24} className="text-gray-400" />
                </div>
                <p className="font-black text-gray-700">No notifications</p>
                <p className="mt-1 text-sm text-gray-500">Updates from dispatch and your reports appear here.</p>
              </div>
            ) : (
              <div className="px-4 pb-4 space-y-2">
                {items.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.kind === 'issue_update' ? 'bg-purple-50' : 'bg-emerald-50'}`}>
                      {n.kind === 'issue_update'
                        ? <Flag size={16} className="text-purple-600" />
                        : <Route size={16} className="text-emerald-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{n.label}</p>
                      {n.sub && <p className="text-xs text-gray-500 truncate">{n.sub}</p>}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 shrink-0">
                      {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 pb-8">
              <button
                onClick={() => { setActiveTab('activity'); setNotifOpen(false); }}
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm uppercase active:scale-95 transition-all"
              >
                View full activity
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}