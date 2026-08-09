// app/api/field-intelligence/corrections/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const companyId = Number(req.nextUrl.searchParams.get('companyId'));
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  const { data: corrections } = await supabase.from('field_corrections')
    .select('*')
    .eq('company_id', companyId)
    .in('status', ['candidate', 'strong_candidate', 'verified'])
    .order('updated_at', { ascending: false });

  const { data: intelligence } = await supabase.from('field_intelligence')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ corrections: corrections || [], intelligence: intelligence || [] });
}