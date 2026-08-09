// lib/core/communications/queue/emailQueue.ts
import { createClient } from '@supabase/supabase-js';
import type { EmailSendRequest } from '../channels/email';
import type { EmailJob } from './emailJob';
import { emailWorker } from './emailWorker';
import { DEFAULT_MAX_ATTEMPTS } from './retryPolicy';
import { CommunicationError } from '../errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Table-backed email queue.
 * - enqueue: durable insert; survives serverless restarts
 * - drain: claims due jobs and delegates processing to emailWorker
 * Safe for concurrent callers: claims use optimistic status transitions.
 */
export const emailQueue = {
  async enqueue(event: string, request: EmailSendRequest): Promise<string> {
    const id =
      request.idempotencyKey ||
      `em_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error } = await supabase.from('email_queue').insert([
      {
        id,
        event,
        request: request as any,
        attempts: 0,
        max_attempts: DEFAULT_MAX_ATTEMPTS,
        next_attempt_at: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      throw new CommunicationError('email queue enqueue failed: ' + error.message, error);
    }
    return id;
  },

  /**
   * Drain due jobs. Call from /api/queue/drain (cron) or opportunistically
   * after enqueue. Returns counts for observability.
   */
  async drain(batchSize = 10): Promise<{ processed: number; failed: number }> {
    const { data: jobs } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_attempt_at', new Date().toISOString())
      .order('next_attempt_at', { ascending: true })
      .limit(batchSize);

    let processed = 0;
    let failed = 0;

    for (const row of (jobs || []) as any[]) {
      // Claim the job — optimistic transition prevents double-processing
      const { error: claimErr } = await supabase
        .from('email_queue')
        .update({ status: 'sending' })
        .eq('id', row.id)
        .eq('status', 'pending');

      if (claimErr) {
        failed++;
        continue;
      }

      const job: EmailJob = {
        id: row.id,
        event: row.event,
        request: row.request as EmailSendRequest,
        attempts: row.attempts || 0,
        maxAttempts: row.max_attempts || DEFAULT_MAX_ATTEMPTS,
        nextAttemptAt: row.next_attempt_at,
        status: 'sending',
        lastError: row.last_error,
        createdAt: row.created_at,
        sentAt: row.sent_at,
        providerMessageId: row.provider_message_id,
      };

      const outcome = await emailWorker.process(job, async (id, patch) => {
        await supabase.from('email_queue').update(patch).eq('id', id);
      });

      if (outcome === 'sent') processed++;
      else failed++;
    }

    return { processed, failed };
  },
};