"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { CircleCheckBig, CircleAlert, CircleX, Info, X } from 'lucide-react';
import { useCompanySession } from '@/lib/store/useCompanySession';

const NOTIFICATION_ICONS = {
  success: CircleCheckBig,
  warning: CircleAlert,
  error: CircleX,
  info: Info,
};

const NOTIFICATION_COLORS = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export default function NotificationsPanel() {
  const { activeNotifications, clearNotification } = useCompanySession();

  return (
    <div className="fixed top-4 right-4 z-50 w-80 space-y-2">
      <AnimatePresence>
        {activeNotifications.map((notification) => {
          const Icon = NOTIFICATION_ICONS[notification.type];
          const colorClass = NOTIFICATION_COLORS[notification.type];
          const time = new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`rounded-xl p-3 border backdrop-blur-md shadow-lg ${colorClass}`}
            >
              <div className="flex items-start gap-3">
                <Icon size={20} className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{notification.message}</p>
                  <p className="text-[10px] opacity-70 mt-1">{time}</p>
                </div>
                <button
                  onClick={() => clearNotification(notification.id)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}