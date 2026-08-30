import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ ok: false, error: 'userId_required' }, { status: 400 });
  const { data, error } = await admin().from('notifications')
    .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, notifications: data });
}

export async function POST(req: NextRequest) {
  const { userId, notificationId } = await req.json();
  if (notificationId) await admin().from('notifications').update({ read: true }).eq('id', notificationId);
  else if (userId) await admin().from('notifications').update({ read: true }).eq('user_id', userId);
  else return NextResponse.json({ ok: false, error: 'id_required' }, { status: 400 });
  return NextResponse.json({ ok: true });
}