// lib/super-admin/hooks/useUsers.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import { listPlatformUsers, getAccessLogs, setPlatformRole, type PlatformUserRow } from '../services/user.service';

export function useUsers() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabaseGetMe();
    const [u, l] = await Promise.all([listPlatformUsers(), getAccessLogs()]);
    setUsers(u); setLogs(l); setMyId(user?.id || null); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { users, logs, loading, myId, reload: load, setRole: setPlatformRole };
}

import { adminSupabase } from '../supabase/client';
async function supabaseGetMe() {
  return adminSupabase.auth.getUser();
}