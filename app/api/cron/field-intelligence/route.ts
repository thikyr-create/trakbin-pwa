// app/api/cron/field-intelligence/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fieldIntelligenceService } from '@/lib/core/field-intelligence/services/fieldIntelligenceService';
import { fieldFeedbackAggregator } from '@/lib/core/field-intelligence/feedback/fieldFeedbackAggregator';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Vercel Cron automatically injects CRON_SECRET into the Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all active haulers/companies
  const { data: companies } = await supabaseAdmin
    .from('haulers')
    .select('id')
    .eq('status', 'active'); // Adjust column name if your status column is different

  if (!companies || companies.length === 0) {
    return NextResponse.json({ ok: true, message: 'No active companies' });
  }

  const results = [];
  const sinceIso = new Date(Date.now() - 7 * 864e5).toISOString(); // Last 7 days
  const untilIso = new Date().toISOString();

  for (const company of companies) {
    try {
      // 1. Run the full intelligence pipeline (replay, analyze, correct, learn)
      const pipelineResult = await fieldIntelligenceService.runDaily(company.id, sinceIso, untilIso);
      
      // 2. Generate feedback instructions and publish the platform event
      const feedbackResult = await fieldFeedbackAggregator.run(company.id);

      results.push({
        companyId: company.id,
        pipeline: pipelineResult,
        feedback: feedbackResult,
      });
    } catch (err) {
      console.error(`[cron/field-intelligence] Failed for company ${company.id}`, err);
      results.push({ companyId: company.id, error: (err as Error).message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}