// app/api/field-intelligence/corrections/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { correctionRepository } from '@/lib/core/field-intelligence/storage/correctionRepository';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { correctionId, reviewedBy } = body;
  if (!correctionId) return NextResponse.json({ error: 'correctionId required' }, { status: 400 });

  await correctionRepository.setStatus(correctionId, 'rejected', reviewedBy);
  return NextResponse.json({ ok: true });
}