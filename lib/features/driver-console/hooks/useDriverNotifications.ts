// lib/features/driver-console/hooks/useDriverNotifications.ts
"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDriverSession } from '@/lib/store/useDriverSession';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface DriverNotification {
  id: string;
  kind: 'issue_update' | 'route_assigned';
  label: string;
  sub: string | null;
  at: string;
}

/** Read-model over existing tables only — no new notification system. */
export function useDriverNotifications() {
  const { driver, driverCompanyId } = useDriverSession();
  const [items, setItems] = useState<DriverNotification[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);

  const driverId = driver?.employee_id || driver?.id || null;
  const storageKey = `trakbin_driver_notif_seen_${driverId}`;

  useEffect(() => {
    if (driverId) setSeenAt(localStorage.getItem(storageKey));
  }, [driverId, storageKey]);

  const fetchAll = useCallback(async () => {
    if (!driverCompanyId || !driverId) return;
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const out: DriverNotification[] = [];

    // Company acted on an issue the driver reported
    const { data: issues } = await supabase
      .from('environmental_issues')
      .select('id, issue_type, status, updated_at')
      .eq('company_id', driverCompanyId)
      .eq('reported_by', driverId)
      .neq('status', 'pending')
      .gte('updated_at', weekAgo)
      .order('updated_at', { ascending: false })
      .limit(10);
    (issues || []).forEach((i: any) =>
      out.push({
        id: `issue-${i.id}`,
        kind: 'issue_update',
        label: i.status === 'resolved' ? 'Your report was resolved' : `Issue ${i.status}`,
        sub: i.issue_type,
        at: i.updated_at,
      })
    );

    // Dispatch assigned a route this week
    const { data: routes } = await supabase
      .from('routes')
      .select('id, total_stops, created_at')
      .eq('company_id', driverCompanyId)
      .eq('driver_id', driverId)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(3);
    (routes || []).forEach((r: any) =>
      out.push({
        id: `route-${r.id}`,
        kind: 'route_assigned',
        label: 'Route assigned',
        sub: `${r.total_stops} stops`,
        at: r.created_at,
      })
    );

    out.sort((a, b) => b.at.localeCompare(a.at));
    setItems(out.slice(0, 20));
  }, [driverCompanyId, driverId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Live: company resolves/updates an issue → badge pops
  useEffect(() => {
    if (!driverCompanyId) return;
    const ch = supabase
      .channel('driver_notifs')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'environmental_issues', filter: `company_id=eq.${driverCompanyId}` },
        () => fetchAll()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [driverCompanyId, fetchAll]);

  const unread = seenAt ? items.filter((i) => i.at > seenAt).length : items.length;

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(storageKey, now);
    setSeenAt(now);
  }, [storageKey]);

  return { items, unread, markSeen };
}