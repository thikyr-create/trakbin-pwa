// lib/super-admin/hooks/useApprovals.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { getApprovalQueues, actVerification, type ApprovalQueues } from '../services/approval.service';

export function useApprovals() {
  const [queues, setQueues] = useState<ApprovalQueues | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const q = await getApprovalQueues();
    setQueues(q);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { queues, loading, reload: load, act: actVerification };
}