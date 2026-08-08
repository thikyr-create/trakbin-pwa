// app/api/queue/drain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emailQueue } from '@/lib/core/communications/queue/emailQueue';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  // Gate: only your Vercel cron or the dashboard can call this
  const auth = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await emailQueue.drain(20);
  return NextResponse.json({ ok: true, ...result });
}