// app/api/field-intelligence/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { movementAnalyzer } from '@/lib/core/field-intelligence/analyzers/movementAnalyzer';
import { routeAnalyzer } from '@/lib/core/field-intelligence/analyzers/routeAnalyzer';
import { deviationAnalyzer } from '@/lib/core/field-intelligence/analyzers/deviationAnalyzer';
import { pickupAnalyzer } from '@/lib/core/field-intelligence/analyzers/pickupAnalyzer';
import { stopAnalyzer } from '@/lib/core/field-intelligence/analyzers/stopAnalyzer';
import { locationAnalyzer } from '@/lib/core/field-intelligence/analyzers/locationAnalyzer';
import { navigationAnalyzer } from '@/lib/core/field-intelligence/analyzers/navigationAnalyzer';
import { driverBehaviorAnalyzer } from '@/lib/core/field-intelligence/analyzers/driverBehaviorAnalyzer';

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

  const counts: Record<string, number> = {};
  counts.movement = (await movementAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.route = (await routeAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.deviation = (await deviationAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.pickup = (await pickupAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.stop = (await stopAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.location = (await locationAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.navigation = (await navigationAnalyzer.analyze(companyId, sinceIso, untilIso)).length;
  counts.driverBehavior = (await driverBehaviorAnalyzer.analyze(companyId, sinceIso, untilIso)).length;

  return NextResponse.json({ ok: true, signals: counts });
}