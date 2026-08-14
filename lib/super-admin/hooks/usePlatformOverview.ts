// lib/super-admin/hooks/usePlatformOverview.ts
"use client";

import { useEffect, useState } from 'react';
import { getPlatformOverview, getAttentionItems, getRecentActivity } from '../services/analytics.service';
import type { PlatformOverview, AttentionItem, ActivityEvent } from '../types/analytics';

export function usePlatformOverview() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [o, at, ac] = await Promise.all([getPlatformOverview(), getAttentionItems(), getRecentActivity()]);
      if (!alive) return;
      setOverview(o); setAttention(at); setActivity(ac); setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { overview, attention, activity, loading };
}