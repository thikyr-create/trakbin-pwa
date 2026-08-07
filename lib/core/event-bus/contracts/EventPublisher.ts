import type { PlatformEventMap, PlatformEventType } from '../events';
export interface EventPublisher {
  readonly source: string;
  publish<T extends PlatformEventType>(type: T, payload: PlatformEventMap[T], ctx?: { companyId?: number | null; userId?: string | null; metadata?: Record<string, unknown> }): void;
}