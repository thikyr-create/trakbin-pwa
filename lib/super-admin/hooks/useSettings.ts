// lib/super-admin/hooks/useSettings.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { getConfig, saveConfig, type PlatformConfig } from '../services/settings.service';
import { adminSupabase } from '../supabase/client';
import { emitAudit } from '@/lib/core/audit/audit-engine';

export function useSettings() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const c = await getConfig();
    setConfig(c);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (patch: Partial<PlatformConfig>) => {
    setSaving(true);
    try {
      const { data: { user } } = await adminSupabase.auth.getUser();
      await saveConfig(patch, user?.id || null);
      await emitAudit(adminSupabase, {
        category: 'DATA_CHANGE', actorId: user?.id, actorEmail: user?.email,
        action: 'platform_config.update', metadata: { keys: Object.keys(patch) },
      }).catch(() => {});
      await load();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, saving, save, reload: load };
}