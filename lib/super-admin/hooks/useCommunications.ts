// lib/super-admin/hooks/useCommunications.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { getCommsData, sendAnnouncement, type CommsData } from '../services/communication.service';
import { adminSupabase as supabase } from '../supabase/client';

export function useCommunications() {
  const [data, setData] = useState<CommsData | null>(null);
  const [orgs, setOrgs] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [d, h] = await Promise.all([
      getCommsData(),
      supabase.from('haulers').select('id, business_name'),
    ]);
    setData(d);
    setOrgs((h.data || []).map((x: any) => ({ id: x.id, name: x.business_name })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, orgs, loading, reload: load, send: sendAnnouncement };
}