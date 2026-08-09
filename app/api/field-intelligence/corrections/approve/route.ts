// app/api/field-intelligence/corrections/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { correctionRepository } from '@/lib/core/field-intelligence/storage/correctionRepository';
import { locationCorrector } from '@/lib/core/field-intelligence/correctors/locationCorrector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { correctionId, reviewedBy } = body;
  if (!correctionId) return NextResponse.json({ error: 'correctionId required' }, { status: 400 });

  const { data: cor } = await supabase.from('field_corrections')
    .select('*').eq('id', correctionId).single();

  if (!cor) return NextResponse.json({ error: 'correction not found' }, { status: 404 });

  await correctionRepository.setStatus(correctionId, 'verified', reviewedBy);

  // Auto-apply if it's a building location correction
  if (cor.entity_type === 'building' && cor.field === 'location') {
    await locationCorrector.apply(cor.company_id, correctionId, cor.proposed_value, cor.entity_id);
  }

  return NextResponse.json({ ok: true, applied: true });
}