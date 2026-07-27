"use client";

import { motion } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Pause, 
  RotateCcw, 
  Flag, 
  Truck, 
  MapPin,
  UserPlus // <-- ADDED
} from 'lucide-react';
import { useCompanySession, DispatchEvent } from '@/lib/store/useCompanySession';

// FIX: Added 'as const' and missing keys to lock exact literal types
const EVENT_ICONS = {
  route_started: Play,
  pickup_completed: CheckCircle,
  pickup_skipped: XCircle,
  issue_reported: AlertTriangle,
  route_paused: Pause,
  route_resumed: RotateCcw,
  route_completed: Flag,
  truck_full: Truck,
  disposal: MapPin,
  reassignment: RotateCcw,
  driver_added: UserPlus,   // <-- ADDED
  truck_added: Truck,       // <-- ADDED
} as const;

const EVENT_COLORS = {
  route_started: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  pickup_completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  pickup_skipped: 'text-red-400 bg-red-500/10 border-red-500/30',
  issue_reported: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  route_paused: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  route_resumed: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  route_completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  truck_full: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  disposal: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  reassignment: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  driver_added: 'text-pink-400 bg-pink-500/10 border-pink-500/30',   // <-- ADDED
  truck_added: 'text-violet-400 bg-violet-500/10 border-violet-500/30', // <-- ADDED
} as const;

export default function DispatchTimeline() {
  const { dispatchTimeline } = useCompanySession();

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-black text-white uppercase">Dispatch Timeline</h3>
        <p className="text-xs text-gray-400 mt-1">Today's operational log</p>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {dispatchTimeline.length === 0 ? (
          <div className="text-center py-8">
            <Play size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No events yet today</p>
          </div>
        ) : (
          dispatchTimeline.map((event, index) => {
            const Icon = EVENT_ICONS[event.type] || Play;
            const colorClass = EVENT_COLORS[event.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30';
            const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{event.truck_id}</span>
                    <span className="text-[10px] text-gray-500">{time}</span>
                  </div>
                  <p className="text-xs text-gray-300">{event.message}</p>
                  {event.building_id && (
                    <p className="text-[10px] text-gray-500 mt-1">Building: {event.building_id}</p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}