// app/hauler-dashboard/screens/ActivityScreen.tsx
"use client";

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useActivityTimeline } from '@/lib/features/driver-console/hooks/useActivityTimeline';
import ActivityItem from '../components/activity/ActivityItem';

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ActivityScreen() {
  const { events, loading } = useActivityTimeline();

  const groups = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const key = dayLabel(e.occurred_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()];
  }, [events]);

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">Activity</h2>
          <p className="text-xs font-semibold text-gray-500">Operational timeline</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black">
          {events.length} events
        </span>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-12">Loading timeline…</p>
      ) : events.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
            <Activity size={26} className="text-gray-500" />
          </div>
          <p className="font-black text-gray-700">No activity yet</p>
          <p className="mt-1 text-sm text-gray-500">Your operational timeline builds automatically as you work.</p>
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-5">
          {groups.map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">{day}</p>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                {list.map((e, i) => (
                  <ActivityItem key={e.id} event={e} isLast={i === list.length - 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}