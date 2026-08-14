// lib/super-admin/hooks/usePlatformHealth.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  runProbes, getJobsHealth, getIncidents,
  type ProbeResult, type JobsHealth, type Incident,
} from '../services/health.service';
import { adminSupabase } from '../supabase/client';

export function usePlatformHealth() {
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [jobs, setJobs] = useState<JobsHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [p, j, i] = await Promise.all([runProbes(adminSupabase), getJobsHealth(), getIncidents()]);
    setProbes(p); setJobs(j); setIncidents(i); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { probes, jobs, incidents, loading, refresh };
}