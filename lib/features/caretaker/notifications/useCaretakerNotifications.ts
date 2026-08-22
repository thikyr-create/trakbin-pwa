// lib/features/caretaker/notifications/useCaretakerNotifications.ts
"use client";

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export type CaretakerNotificationKind =
  | 'pickup'
  | 'pickup_disputed'
  | 'issue_update'
  | 'service_activated'
  | 'invoice_paid';

export interface CaretakerNotification {
  id: string;
  kind: CaretakerNotificationKind;
  label: string;
  sub: string | null;
  at: string;
  refId: string | null; // route_stop id when disputable
  disputed: boolean;
}

/** Unified read-model over the four tables that describe a building's life:
 *  route_stops (pickups), environmental_issues (reports), invoices (billing),
 *  service_assignments (activation). No new notification system — pure read-model. */
export function useCaretakerNotifications() {
  const { building, companyProfile } = useCaretakerSession();
  const buildingId = building?.custom_id ?? null;
  const [items, setItems] = useState<CaretakerNotification[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const storageKey = `trakbin_caretaker_notif_seen_${buildingId}`;

  useEffect(() => {
    if (buildingId) setSeenAt(localStorage.getItem(storageKey));
  }, [buildingId, storageKey]);

  const fetchAll = useCallback(async () => {
    if (!buildingId) return;
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const out: CaretakerNotification[] = [];

    // Independent requests: one bad table can't kill the feed
    const [stopsRes, issuesRes, invoicesRes, assignRes] = await Promise.all([
      supabase.from('route_stops')
        .select('id, completion_time, disputed')
        .eq('building_id', buildingId)
        .eq('status', 'completed')
        .gte('completion_time', weekAgo),
      supabase.from('environmental_issues')
        .select('id, issue_type, status, updated_at')
        .eq('building_id', buildingId)
        .neq('status', 'pending')
        .gte('updated_at', weekAgo),
      supabase.from('invoices')
        .select('id, amount, status, description, created_at')
        .eq('building_id', buildingId)
        .eq('status', 'paid')
        .gte('created_at', weekAgo),
      supabase.from('service_assignments')
        .select('id, created_at, service_status')
        .eq('building_id', buildingId)
        .eq('service_status', 'active')
        .gte('created_at', weekAgo),
    ]);

    (stopsRes.data || []).forEach((s: any) =>
      out.push({
        id: `pickup-${s.id}`,
        kind: s.disputed ? 'pickup_disputed' : 'pickup',
        label: s.disputed ? 'Pickup disputed' : 'Pickup completed',
        sub: s.disputed ? 'Reported to your waste company' : 'Confirm or dispute this pickup',
        at: s.completion_time,
        refId: s.id,
        disputed: !!s.disputed,
      })
    );

    (issuesRes.data || []).forEach((i: any) =>
      out.push({
        id: `issue-${i.id}`,
        kind: 'issue_update',
        label: i.status === 'resolved' ? 'Your report was resolved' : `Report ${i.status}`,
        sub: i.issue_type,
        at: i.updated_at,
        refId: null,
        disputed: false,
      })
    );

    (invoicesRes.data || []).forEach((v: any) =>
      out.push({
        id: `invoice-${v.id}`,
        kind: 'invoice_paid',
        label: 'Invoice settled',
        sub: `₦${Number(v.amount || 0).toLocaleString()} · ${v.description || 'Monthly collection'}`,
        at: v.created_at,
        refId: null,
        disputed: false,
      })
    );

    (assignRes.data || []).forEach((a: any) =>
      out.push({
        id: `service-${a.id}`,
        kind: 'service_activated',
        label: 'Service activated',
        sub: companyProfile?.business_name ? `Provider: ${companyProfile.business_name}` : 'Your waste provider is now active',
        at: a.created_at ?? new Date().toISOString(),
        refId: null,
        disputed: false,
      })
    );

    out.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
    setItems(out.slice(0, 20));
  }, [buildingId, companyProfile?.business_name]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Live updates across all four sources
  useEffect(() => {
    if (!buildingId) return;
    const ch = supabase.channel(`caretaker_notifs_${buildingId}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'route_stops', filter: `building_id=eq.${buildingId}` }, () => fetchAll())
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'environmental_issues', filter: `building_id=eq.${buildingId}` }, () => fetchAll())
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'invoices', filter: `building_id=eq.${buildingId}` }, () => fetchAll())
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'service_assignments', filter: `building_id=eq.${buildingId}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [buildingId, fetchAll]);

  const disputePickup = useCallback(async (stopId: string, note?: string) => {
    const { error } = await supabase
      .from('route_stops')
      .update({ disputed: true, disputed_at: new Date().toISOString(), dispute_note: note || null })
      .eq('id', stopId);
    if (error) return { ok: false, error: error.message };
    await fetchAll();
    return { ok: true };
  }, [fetchAll]);

  const unread = seenAt ? items.filter((i) => i.at > seenAt).length : items.length;

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(storageKey, now);
    setSeenAt(now);
  }, [storageKey]);

  return { items, unread, markSeen, disputePickup };
}