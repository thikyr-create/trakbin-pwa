import { withRetry } from '../errors/RetryQueue';
import { deadLetterQueue } from '../errors/DeadLetterQueue';
import type { HistoryEntry } from '../history/EventStore';
import type { EventEnvelope } from '../contracts/Event';

export class EventExecutor {
  async execute(name: string, fn: () => void | Promise<void>, event: EventEnvelope, entry: HistoryEntry): Promise<void> {
    try {
      await withRetry(fn);
      entry.outcomes.push({ handler: name, status: 'ok' });
    } catch (e: any) {
      entry.outcomes.push({ handler: name, status: 'failed', error: e?.message });
      deadLetterQueue.push({ event, error: e?.message ?? 'unknown', failedAt: new Date().toISOString(), attempts: 3 });
    }
  }
}