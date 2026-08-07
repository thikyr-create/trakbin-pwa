import type { EventEnvelope } from '../contracts/Event';
export interface ExecutionContext { event: EventEnvelope; startedAt: number; locals: Record<string, unknown>; }