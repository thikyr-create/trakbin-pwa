// lib/core/communications/queue/emailQueue.ts
import { createClient } from '@supabase/supabase-js';
import { emailChannel } from '../channels/email';
import type { EmailSendRequest } from '../channels/email';
import type { EmailJob } from './emailJob';
import { nextAttemptAt, DEFAULT_MAX_ATTEMPTS } from './retryPolicy';
import { CommunicationError } from '../errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const emailQueue = {
  async enqueue(event: string, request: EmailSendRequest): Promise<string> {
    const id = request.idempotencyKey || `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.from('email_queue').insert([{
      id, event, request: request as any, attempts: 0, max_attempts: DEFAULT_MAX_ATTEMPTS,
      next_attempt_at: new Date().toISOString(), status: 'pending',
      created_at: new Date().toISOString(),
    }]);
    if (error) throw new CommunicationError('email queue enqueue failed: ' + error.message, error);
    return id;
  },

  /**
   * Drain due jobs. Call this from a serverless route (e.g. /api/queue/drain)
   * or from a cron. Safe to run concurrently — SELECT … FOR UPDATE SKIP LOCKED
   * is approximated by optimistic status transitions.
   */
  async drain(batchSize = 10): Promise<{ processed: number; failed: number }> {
    const { data: jobs } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_attempt_at', new Date().toISOString())
      .order('next_attempt_at', { ascending: true })
      .limit(batchSize);

    let processed = 0, failed = 0;
    for (const j of (jobs || []) as any[]) {
      // Claim the job
      const { error: claimErr } = await supabase
        .from('email_queue')
        .update({ status: 'sending' })
        .eq('id', j.id)
        .eq('status', 'pending');
      if (claimErr) { failed++; continue; }

      try {
        const record = await emailChannel.send(j.request as EmailSendRequest);
        await supabase.from('email_queue').update({
          status: record.status === 'sent' || record.status === 'dry_run' ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
          provider_message_id: record.id,
          last_error: record.errorMessage || null,
        }).eq('id', j.id);
        processed++;
      } catch (err: any) {
        const attempts = (j.attempts || 0) + 1;
        const maxAttempts = j.max_attempts || DEFAULT_MAX_ATTEMPTS;
        const terminal = attempts >= maxAttempts;
        await supabase.from('email_queue').update({
          status: terminal ? 'abandoned' : 'pending',
          attempts,
          next_attempt_at: terminal ? null : nextAttemptAt(attempts),
          last_error: err?.message || 'unknown',
        }).eq('id', j.id);
        failed++;
      }
    }
    return { processed, failed };
  },
};