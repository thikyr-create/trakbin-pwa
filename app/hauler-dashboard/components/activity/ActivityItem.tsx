// app/hauler-dashboard/components/activity/ActivityItem.tsx
"use client";

import type { ActivityEvent } from '@/lib/features/driver-console/hooks/useActivityTimeline';

interface Meta {
  label: string;
  color: string; // dot color class
}

function eventMeta(e: ActivityEvent): Meta {
  switch (e.event_type) {
    case 'DRIVER_ROUTE_STARTED': return { label: 'Route started', color: 'bg-emerald-500' };
    case 'DRIVER_ROUTE_COMPLETED': return { label: 'Route completed', color: 'bg-emerald-600' };
    case 'DRIVER_ROUTE_PAUSED': return { label: 'Route paused', color: 'bg-amber-500' };
    case 'DRIVER_ROUTE_RESUMED': return { label: 'Route resumed', color: 'bg-emerald-500' };
    case 'DRIVER_STOP_APPROACHED': return { label: `Approaching ${e.building_id ?? 'stop'}`, color: 'bg-blue-500' };
    case 'DRIVER_STOP_ARRIVED': return { label: `Arrived at ${e.building_id ?? 'stop'}`, color: 'bg-blue-600' };
    case 'DRIVER_PICKUP_CONFIRMED': return { label: `Pickup confirmed · ${e.building_id ?? ''}`, color: 'bg-emerald-500' };
    case 'DRIVER_PICKUP_SKIPPED': return { label: `Cannot collect · ${e.building_id ?? ''}`, color: 'bg-red-500' };
    case 'DRIVER_PICKUP_FAILED': return { label: `Pickup failed · ${e.building_id ?? ''}`, color: 'bg-red-600' };
    case 'DRIVER_EVIDENCE_ATTACHED': return { label: 'Evidence submitted', color: 'bg-blue-500' };
    case 'DRIVER_DEVIATED': return { label: 'Deviated from route', color: 'bg-red-500' };
    case 'DRIVER_REJOINED_ROUTE': return { label: 'Rejoined route', color: 'bg-emerald-500' };
    case 'DRIVER_FEEDBACK_SUBMITTED': return { label: 'Note / issue reported', color: 'bg-purple-500' };
    case 'DRIVER_LOCATION_CORRECTED': return { label: 'Location corrected', color: 'bg-blue-600' };
    default: return { label: e.event_type.replace(/DRIVER_|_/g, ' ').toLowerCase(), color: 'bg-gray-400' };
  }
}

function subLabel(e: ActivityEvent): string | null {
  const m = e.metadata || {};
  if (m.reason) return m.reason;
  if (m.distanceM != null) return `${m.distanceM} m from pin`;
  if (m.category) return m.category;
  if (m.count != null) return `${m.count} file(s)`;
  return null;
}

export default function ActivityItem({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const meta = eventMeta(event);
  const sub = subLabel(event);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full ${meta.color} ring-4 ring-white`} />
        {!isLast && <span className="w-px flex-1 bg-gray-200" />}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-4'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold text-gray-900 truncate">{meta.label}</p>
          <p className="text-[10px] font-bold text-gray-400 shrink-0">
            {new Date(event.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}