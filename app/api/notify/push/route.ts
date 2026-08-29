import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const { userId, title, body } = await req.json();
  const { data } = await admin().from('device_tokens').select('token').eq('user_id', userId);
  const tokens = (data || []).map((d: any) => d.token);
  if (!tokens.length) return NextResponse.json({ ok: true, sent: 0 });
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tokens.map((to: string) => ({ to, title, body, sound: 'default' }))),
  });
  return NextResponse.json({ ok: true, sent: tokens.length, result: await res.json() });
}