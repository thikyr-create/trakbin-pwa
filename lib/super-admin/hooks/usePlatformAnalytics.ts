// lib/super-admin/hooks/usePlatformAnalytics.ts
"use client";

import { useEffect, useState } from 'react';
import { getPlatformAnalytics, type PlatformAnalytics } from '../services/platform-analytics.service';

export function usePlatformAnalytics() {
  const [a, setA] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await getPlatformAnalytics();
      if (!alive) return;
      setA(data);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { a, loading };
}