import 'server-only';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export interface NotifyInput {
  emails?: string[];
  userIds?: string[];
  buildingId?: string | null;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Persist + push. Never throws — a notification failure must never fail a payment.
export async function notify(input: NotifyInput): Promise<void> {
  try {
    let userIds = Array.from(new Set(input.userIds ?? []));
    if (input.emails?.length) {
      const { data } = await admin().schema('auth').from('users').select('id').in('email', input.emails);
      userIds = Array.from(new Set([...userIds, ...(data ?? []).map((u: any) => u.id)]));
    }
    if (!userIds.length) return;

    const data = input.data ?? {};
    await admin().from('notifications').insert(userIds.map((uid) => ({
      user_id: uid,
      building_id: input.buildingId ?? null,
      type: input.type,
      title: input.title,
      message: input.body,          // existing column name
      data,
      read: false,
    })));

    const { data: tokens } = await admin().from('device_tokens').select('token').in('user_id', userIds);
    const tos = (tokens ?? []).map((t: any) => t.token).filter(Boolean);
    if (!tos.length) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tos.map((to: string) => ({
        to, title: input.title, body: input.body, data, channelId: 'default',
      }))),
    });
  } catch (e) { console.warn('notify deferred:', e); }
}