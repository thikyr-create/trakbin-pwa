// lib/features/driver-console/hooks/useActivityTimeline.ts
"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDriverSession } from '@/lib/store/useDriverSession';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  // Live updates as new activity is recorded
  useEffect(() => {
    if (!driverCompanyId) return;
    const channel = supabase
      .channel('driver_activity_live')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'driver_activity', filter: `company_id=eq.${driverCompanyId}` },
        () => fetchEvents()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driverCompanyId, fetchEvents]);

  return { events, loading };
}