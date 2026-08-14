// lib/super-admin/services/communication.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface CommsData {
  notices: any[];
  notifications: any[];
  emailQueue: any[];
  emailDelivery: any[];
}

async function safe(table: string): Promise<any[]> {
  try {
    const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
  } catch {
    const { data } = await supabase.from(table).select('*').limit(50);
    return data || [];
  }
}

export async function getCommsData(): Promise<CommsData> {
  const [notices, notifications, emailQueue, emailDelivery] = await Promise.all([
    safe('notices'), safe('notifications'), safe('email_queue'), safe('email_delivery'),
  ]);
  return { notices, notifications, emailQueue, emailDelivery };
}

export async function sendAnnouncement(args: { title: string; body: string; audience: 'all' | 'org'; orgId?: number }) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin/comms/announce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(args),
  });
  return res.json();
}