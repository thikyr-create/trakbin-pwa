// lib/core/communications/queue/emailWorker.ts
import { emailChannel } from '../channels/email';
import type { EmailJob } from './emailJob';
import { nextAttemptAt, DEFAULT_MAX_ATTEMPTS } from './retryPolicy';

export type JobOutcome = 'sent' | 'retry' | 'abandoned';

export const emailWorker = {
  async process(
    job: EmailJob,
    persist: (id: string, patch: Record<string, any>) => Promise<void>
  ): Promise<JobOutcome> {
    try {
      const record = await emailChannel.send(job.request);
      await persist(job.id, {
        status: record.status === 'failed' ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: record.id,
        last_error: record.errorMessage || null,
      });
      return 'sent';
    } catch (err: any) {
      const attempts = (job.attempts || 0) + 1;
      const max = job.maxAttempts || DEFAULT_MAX_ATTEMPTS;
      const terminal = attempts >= max;
      await persist(job.id, {
        status: terminal ? 'abandoned' : 'pending',
        attempts,
        next_attempt_at: terminal ? null : nextAttemptAt(attempts),
        last_error: err?.message || 'unknown',
      });
      return terminal ? 'abandoned' : 'retry';
    }
  },
};