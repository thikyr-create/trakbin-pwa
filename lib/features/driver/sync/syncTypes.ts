// lib/features/driver/sync/syncTypes.ts
export interface QueuedItem {
  idempotencyKey: string;
  type: 'driver_activity';
  payload: Record<string, unknown>;
  enqueuedAt: string;
  attempts?: number;
}
export type SyncStatus = 'idle' | 'flushing' | 'drained';