import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { useSessionStore } from '../store/session';
import { calculateDistanceMeters } from '../services/location';

export interface ProgressData {
  total: number;
  completed: number;
  skipped: number;
  inProgress: number;
  remaining: number;
  pct: number;
  traveledKm: number | null;
  wasteKg: number | null;
  timeOnRouteMin: number | null;
  onTime: { done: number; total: number } | null;
  successRate: number | null;
}

export function useProgress(): ProgressData {
  const { route, routeStops, driver, driverCompanyId } = useSessionStore();
  const [wasteKg, setWasteKg] = useState<number | null>(null);
  const [timeOnRouteMin, setTimeOnRouteMin] = useState<number | null>(null);

  const sorted = useMemo(() => [...routeStops].sort((a, b) => a.sequence - b.sequence), [routeStops]);

  const stats = useMemo(() => {
    const total = sorted.length;
    const completed = sorted.filter((s: any) => s.status === 'completed').length;
    const skipped = sorted.filter((s: any) => s.status === 'skipped').length;
    const inProgress = sorted.filter((s: any) => s.status === 'arrived').length;
    const remaining = total - completed - skipped - inProgress;

    // Distance travelled: walk legs up to (not including) first pending stop
    let traveledM = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev: any = sorted[i - 1];
      const cur: any = sorted[i];
      if (cur.status === 'pending') break;
      if (prev.latitude != null && prev.longitude != null && cur.latitude != null && cur.longitude != null) {
        traveledM += calculateDistanceMeters(prev.latitude, prev.longitude, cur.latitude, cur.longitude);
      }
    }

    // On-time: only when schedule data actually exists on stops
    const hasSchedule = sorted.some((s: any) => s.scheduled_time != null || s.planned_time != null || s.eta_time != null);
    let onTime: { done: number; total: number } | null = null;
    if (hasSchedule) {
      const doneStops = sorted.filter((s: any) => s.status === 'completed');
      const on = doneStops.filter((s: any) => {
        const sched = s.scheduled_time ?? s.planned_time ?? s.eta_time;
        return sched != null && s.completion_time != null && new Date(s.completion_time) <= new Date(sched);
      }).length;
      onTime = { done: on, total: doneStops.length };
    }

    const successRate = completed + skipped > 0 ? completed / (completed + skipped) : null;

    return {
      total, completed, skipped, inProgress, remaining,
      pct: total > 0 ? completed / total : 0,
      traveledKm: traveledM > 0 ? Math.round((traveledM / 1000) * 10) / 10 : null,
      onTime,
      successRate,
    };
  }, [sorted]);

  // Waste collected — only when the data exists
  useEffect(() => {
    if (!driverCompanyId) return;
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    (async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('company_id', driverCompanyId)
        .gte('collection_date', dayStart)
        .limit(500);
      if (!data?.length) { setWasteKg(null); return; }
      let sum = 0;
      let found = false;
      for (const row of data) {
        for (const key of ['weight_kg', 'waste_weight_kg', 'waste_weight', 'total_weight_kg']) {
          const v = (row as any)[key];
          if (typeof v === 'number' && v > 0) { sum += v; found = true; break; }
        }
      }
      setWasteKg(found ? Math.round(sum) : null);
    })();
  }, [driverCompanyId, stats.completed]);

  // Pause-aware time on route, from the activity trail (never fabricated)
  useEffect(() => {
    if (!route || !driverCompanyId || !driver) return;
    const driverId = driver.employee_id || driver.id;
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    (async () => {
      const { data } = await supabase
        .from('driver_activity')
        .select('event_type, occurred_at')
        .eq('company_id', driverCompanyId)
        .eq('driver_id', driverId)
        .in('event_type', ['DRIVER_ROUTE_STARTED', 'DRIVER_ROUTE_PAUSED', 'DRIVER_ROUTE_RESUMED'])
        .gte('occurred_at', dayStart)
        .order('occurred_at', { ascending: true });
      if (!data?.length) { setTimeOnRouteMin(null); return; }

      const started = data.find((e: any) => e.event_type === 'DRIVER_ROUTE_STARTED');
      if (!started) { setTimeOnRouteMin(null); return; }

      let pausedMs = 0;
      let pauseOpenAt: string | null = null;
      for (const e of data) {
        if (e.event_type === 'DRIVER_ROUTE_PAUSED') pauseOpenAt = e.occurred_at;
        if (e.event_type === 'DRIVER_ROUTE_RESUMED' && pauseOpenAt) {
          pausedMs += new Date(e.occurred_at).getTime() - new Date(pauseOpenAt).getTime();
          pauseOpenAt = null;
        }
      }
      if (pauseOpenAt) pausedMs += Date.now() - new Date(pauseOpenAt).getTime();

      const activeMs = Date.now() - new Date(started.occurred_at).getTime() - pausedMs;
      setTimeOnRouteMin(Math.max(0, Math.round(activeMs / 60000)));
    })();
  }, [route, driverCompanyId, driver, stats.completed]);

  return { ...stats, wasteKg, timeOnRouteMin };
}