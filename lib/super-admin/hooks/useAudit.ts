// lib/super-admin/hooks/useAudit.ts
"use client";

import { useEffect, useState } from 'react';
import { listAuditEvents } from '../services/audit.service';

export function useAudit() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const e = await listAuditEvents();
      if (!alive) return;
      setEvents(e);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { events, loading };
}