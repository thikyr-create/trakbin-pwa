// app/api/field-intelligence/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fieldIntelligenceService } from '@/lib/core/field-intelligence/services/fieldIntelligenceService';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('x-fi-key') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const companyId = Number(body.companyId);
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  const sinceIso = body.sinceIso ?? new Date(Date.now() - 7 * 864e5).toISOString();
  const untilIso = body.untilIso ?? new Date().toISOString();

  const result = await fieldIntelligenceService.runDaily(companyId, sinceIso, untilIso);
  return NextResponse.json({ ok: true, ...result });
}