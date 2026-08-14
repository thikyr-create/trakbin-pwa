// lib/super-admin/hooks/useNetwork.ts
"use client";

import { useEffect, useState } from 'react';
import { getNetworkOverview, type NetworkOverview } from '../services/network.service';

export function useNetwork() {
  const [network, setNetwork] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const n = await getNetworkOverview();
      if (!alive) return;
      setNetwork(n);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { network, loading };
}