export interface QueuedItem {
  idempotencyKey: string;
  type: 'driver_activity' | 'driver_breadcrumb';
  payload: Record<string, unknown>;
  enqueuedAt: string;
  attempts?: number;
}

export type SyncStatus = 'idle' | 'flushing' | 'drained';