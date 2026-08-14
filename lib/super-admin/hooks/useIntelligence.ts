// lib/super-admin/hooks/useIntelligence.ts
"use client";

import { useEffect, useState } from 'react';
import { getIntelOverview, type IntelligenceOverview } from '../services/intelligence.service';

export function useIntelligence() {
  const [intel, setIntel] = useState<IntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const i = await getIntelOverview();
      if (!alive) return;
      setIntel(i);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { intel, loading };
}