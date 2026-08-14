// lib/super-admin/hooks/useBilling.ts
"use client";

import { useEffect, useState } from 'react';
import { getBillingData, type BillingData } from '../services/billing.service';

export function useBilling() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await getBillingData();
      if (!alive) return;
      setBilling(b);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { billing, loading };
}