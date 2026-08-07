import type { EventEnvelope } from '../contracts/Event';

export interface DeadLetter { event: EventEnvelope; error: string; failedAt: string; attempts: number; }
const queue: DeadLetter[] = [];

export const deadLetterQueue = {
  push(d: DeadLetter) { queue.push(d); if (queue.length > 200) queue.shift(); },
  all: () => [...queue],
  clear: () => { queue.length = 0; },
};