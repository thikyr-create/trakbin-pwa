// lib/features/driver-console/hooks/useActivityTimeline.ts
"use client";

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useDriverSession } from '@/lib/store/useDriverSession';

const supabase = supabaseBrowser;

export interface ActivityEvent {
  id: number;
  event_type: string;
  building_id: string | null;
  metadata: Record<string, any>;
  occurred_at: string;
}

/** Operational timeline — reads the existing activity trail, never fabricates. */
export function useActivityTimeline() {
  const { driver, driverCompanyId } = useDriverSession();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const driverId = driver?.employee_id || driver?.id || null;

  const fetchEvents = useCallback(async () => {
    if (!driverCompanyId || !driverId) return;
    const { data } = await supabase
      .from('driver_activity')
      .select('id, event_type, building_id, metadata, occurred_at')
      .eq('company_id', driverCompanyId)
      .eq('driver_id', driverId)
      .order('occurred_at', { ascending: false })
      .limit(200);
    if (data) setEvents(data as ActivityEvent[]);
    setLoading(false);
  }, [driverCompanyId, driverId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Live updates — unique topic per instance
  useEffect(() => {
    if (!driverCompanyId) return;
    const topic = `driver_activity_${Math.random().toString(36).slice(2)}`;
    const ch = supabase
      .channel(topic)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'driver_activity', filter: `company_id=eq.${driverCompanyId}` },
        () => fetchEvents()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [driverCompanyId, fetchEvents]);

  return { events, loading };
}