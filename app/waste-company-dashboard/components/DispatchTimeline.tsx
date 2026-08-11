"use client";

import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CircleCheck, SkipForward, TriangleAlert, Pause, PlayCircle,
  Flag, Package, Recycle, Repeat, UserPlus, Truck, Zap, Radio, Activity,
  type LucideIcon,
} from 'lucide-react';
import { useCompanySession, type DispatchEventType } from '@/lib/store/useCompanySession';

// ── Guardrailed lookup tables ─────────────────────────────────────────────
// Typed as Record<DispatchEventType, …> on purpose: adding a new event type
// to the union now forces a compile error HERE, so presentation can never
// silently drift out of sync with the domain model.
const EVENT_ICONS: Record<DispatchEventType, LucideIcon> = {
  route_started: Play,
  pickup_completed: CircleCheck,
  pickup_skipped: SkipForward,
  issue_reported: TriangleAlert,
  route_paused: Pause,
  route_resumed: PlayCircle,
  route_completed: Flag,
  truck_full: Package,
  disposal: Recycle,
  reassignment: Repeat,
  driver_added: UserPlus,
  truck_added: Truck,
  service_activated: Zap,
};

const EVENT_COLORS: Record<DispatchEventType, string> = {
  route_started: 'text-sky-600 bg-sky-50 ring-sky-200',
  pickup_completed: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
  pickup_skipped: 'text-amber-600 bg-amber-50 ring-amber-200',
  issue_reported: 'text-rose-600 bg-rose-50 ring-rose-200',
  route_paused: 'text-amber-600 bg-amber-50 ring-amber-200',
  route_resumed: 'text-sky-600 bg-sky-50 ring-sky-200',
  route_completed: 'text-emerald-600 bg-emerald-50 ring-emerald-200',
  truck_full: 'text-orange-600 bg-orange-50 ring-orange-200',
  disposal: 'text-slate-600 bg-slate-100 ring-slate-200',
  reassignment: 'text-cyan-600 bg-cyan-50 ring-cyan-200',
  driver_added: 'text-sky-600 bg-sky-50 ring-sky-200',
  truck_added: 'text-sky-600 bg-sky-50 ring-sky-200',
  service_activated: 'text-emerald-700 bg-emerald-100 ring-emerald-300',
};

const EVENT_LABELS: Record<DispatchEventType, string> = {
  route_started: 'Route Started',
  pickup_completed: 'Pickup Complete',
  pickup_skipped: 'Pickup Skipped',
  issue_reported: 'Issue Reported',
  route_paused: 'Route Paused',
  route_resumed: 'Route Resumed',
  route_completed: 'Route Completed',
  truck_full: 'Truck Full',
  disposal: 'Disposal Logged',
  reassignment: 'Reassigned',
  driver_added: 'Driver Added',
  truck_added: 'Truck Added',
  service_activated: 'Service Activated',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DispatchTimeline() {
  const { dispatchTimeline } = useCompanySession();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Ambient mission-control dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(16,185,129,0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Top accent wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-50/80 to-transparent"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <Radio className="h-5 w-5 text-white" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
          </div>
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Live Telemetry
            </p>
            <h2 className="text-xl font-black leading-tight tracking-tight text-gray-900">
              Dispatch Timeline
            </h2>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 sm:flex">
          <span className="font-mono text-xs font-bold tabular-nums text-gray-900">
            {String(dispatchTimeline.length).padStart(3, '0')}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            events
          </span>
        </div>
      </div>

      {/* Feed */}
      <div className="relative z-10 max-h-[460px] overflow-y-auto px-6 py-5">
        {dispatchTimeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
              <Activity className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-700">No events streaming yet</p>
            <p className="mt-1 max-w-xs text-xs text-gray-400">
              Route starts, pickups and activations will appear here the instant they happen.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-300">
              awaiting signal…
            </p>
          </div>
        ) : (
          <ol className="relative ml-1 space-y-1 border-l border-gray-200 pl-7">
            {/* Glowing spine overlay */}
            <span
              aria-hidden
              className="absolute -left-px top-0 h-32 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-200 to-transparent"
            />
            <AnimatePresence initial={false}>
              {dispatchTimeline.map((event, index) => {
                const Icon = EVENT_ICONS[event.type] || Play;
                const colorClass = EVENT_COLORS[event.type] || 'text-gray-500 bg-gray-50 ring-gray-200';
                const label = EVENT_LABELS[event.type] || event.type;
                const isMilestone = event.type === 'service_activated';

                return (
                  <motion.li
                    key={event.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, delay: Math.min(index, 6) * 0.03 }}
                    className="group relative -ml-7"
                  >
                    {/* Node on the spine */}
                    <span
                      className={`absolute left-0 top-3 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-lg ring-2 ring-white transition-transform duration-200 group-hover:scale-110 ${colorClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {isMilestone && (
                        <span className="absolute inset-0 -z-10 animate-ping rounded-lg bg-emerald-300 opacity-40" />
                      )}
                    </span>

                    {/* Card */}
                    <div className="rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 group-hover:translate-x-1 group-hover:border-gray-100 group-hover:bg-gray-50/80">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                          {label}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-gray-400">
                          {relativeTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-semibold leading-snug text-gray-800">
                        {event.message}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                        {event.driver_name && event.driver_name !== 'System' && (
                          <span className="text-gray-500">{event.driver_name}</span>
                        )}
                        {event.truck_id && event.truck_id !== 'N/A' && (
                          <span className="text-gray-500">{event.truck_id}</span>
                        )}
                        {event.building_id && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                            {event.building_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </div>
  );
}