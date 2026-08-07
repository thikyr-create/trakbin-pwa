import type { EventEnvelope } from '../contracts/Event';

export interface HandlerOutcome { handler: string; status: 'ok' | 'failed'; error?: string; }
export interface HistoryEntry { event: EventEnvelope; receivedAt: string; outcomes: HandlerOutcome[]; }

const ring: HistoryEntry[] = [];
const CAP = 500;

export const eventStore = {
  record(event: EventEnvelope): HistoryEntry {
    const entry: HistoryEntry = { event, receivedAt: new Date().toISOString(), outcomes: [] };
    ring.push(entry); if (ring.length > CAP) ring.shift();
    return entry;
  },
  all: () => [...ring],
};