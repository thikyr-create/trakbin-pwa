// lib/super-admin/hooks/useSubscriptions.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  listSubscriptions, listSubscriptionEvents, usageForSubscriptions,
  grantSubscription, renewSubscription, cancelSubscription,
  type SubscriptionRow,
} from '../services/subscription.service';
import { adminSupabase as supabase } from '../supabase/client';

export function useSubscriptions() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [s, e, u, h] = await Promise.all([
      listSubscriptions(), listSubscriptionEvents(), usageForSubscriptions(),
      supabase.from('haulers').select('id, business_name'),
    ]);
    setSubs(s); setEvents(e); setUsage(u);
    setOrgs((h.data || []).map((x: any) => ({ id: x.id, name: x.business_name })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    subs, events, usage, orgs, loading, reload: load,
    grant: grantSubscription, renew: renewSubscription, cancel: cancelSubscription,
  };
}