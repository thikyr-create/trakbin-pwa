// lib/features/caretaker/notifications/useCaretakerPickupNotifications.ts
"use client";

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import { useCaretakerSession } from '@/lib/store/useCaretakerSession';

export interface PickupNotification {
  id: string;
  buildingId: string;
  routeId: string;
  completedAt: string;
  driverName?: string;
  truckId?: string;
  disputed: boolean;
}

export function useCaretakerPickupNotifications() {
  const { building } = useCaretakerSession();
  const [pickups, setPickups] = useState<PickupNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPickups = useCallback(async () => {
    if (!building?.custom_id) return;
    setLoading(true);
    
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: stops } = await supabase
      .from('route_stops')
      .select('id, route_id, building_id, completion_time, disputed')
      .eq('building_id', building.custom_id)
      .eq('status', 'completed')
      .gte('completion_time', weekAgo)
      .order('completion_time', { ascending: false })
      .limit(20);

    const pickupList: PickupNotification[] = (stops || []).map((s: any) => ({
      id: s.id,
      buildingId: s.building_id,
      routeId: s.route_id,
      completedAt: s.completion_time,
      disputed: s.disputed,
    }));

    setPickups(pickupList);
    setLoading(false);
  }, [building?.custom_id]);

  const disputePickup = async (stopId: string, note?: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('route_stops')
      .update({
        disputed: true,
        disputed_at: new Date().toISOString(),
        dispute_note: note || null,
      })
      .eq('id', stopId);

    if (error) {
      alert('Failed to dispute: ' + error.message);
      setLoading(false);
      return { ok: false, error: error.message };
    }

    await fetchPickups();
    setLoading(false);
    return { ok: true };
  };

  useEffect(() => { fetchPickups(); }, [fetchPickups]);

  // Realtime: watch for new completions and dispute updates
  useEffect(() => {
    if (!building?.custom_id) return;
    const channel = supabase
      .channel(`caretaker-pickups-${building.custom_id}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'route_stops', filter: `building_id=eq.${building.custom_id}` },
        () => fetchPickups()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [building?.custom_id, fetchPickups]);

  const undisputedCount = pickups.filter((p) => !p.disputed).length;

  return { pickups, undisputedCount, loading, disputePickup, refresh: fetchPickups };
}