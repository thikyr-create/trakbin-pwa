import type { EventEnvelope } from './Event';
import type { PlatformEventMap, PlatformEventType } from '../events';
export type EventHandler<T extends PlatformEventType = PlatformEventType> =
  (event: EventEnvelope<T, PlatformEventMap[T]>) => void | Promise<void>;