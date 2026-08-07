import type { EventEnvelope } from '../contracts/Event';
import type { PlatformEventMap, PlatformEventType } from '../events';
import type { EventHandler } from '../contracts/EventHandler';
import { EventPipeline } from '../pipeline/EventPipeline';
import { EventDispatcher } from './EventDispatcher';
import { eventStore } from '../history/EventStore';
import { generateEventId } from '../utils/generateEventId';
import { nowIso } from '../utils/timestamps';
import { subscriberRegistry } from '../registry/SubscriberRegistry';

export interface PublishInput<T extends PlatformEventType> {
  type: T;
  source: string;
  payload: PlatformEventMap[T];
  companyId?: number | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export class EventBus {
  private queue: Promise<void> = Promise.resolve();

  constructor(private pipeline: EventPipeline, private dispatcher: EventDispatcher) {}

  /** Publish: envelope → history → middleware pipeline → dispatch (serialized). */
  publish<T extends PlatformEventType>(input: PublishInput<T>): EventEnvelope<T, PlatformEventMap[T]> {
    const event: EventEnvelope<T, PlatformEventMap[T]> = {
      id: generateEventId(),
      type: input.type,
      source: input.source,
      version: 1,
      companyId: input.companyId ?? null,
      userId: input.userId ?? null,
      occurredAt: nowIso(),
      payload: input.payload,
      metadata: input.metadata ?? {},
    };

    const entry = eventStore.record(event);

    this.queue = this.queue
      .then(async () => {
        await this.pipeline.run({ event, startedAt: Date.now(), locals: {} }, async () => {
          await this.dispatcher.dispatch(event, entry);
        });
      })
      .catch((err) => console.error('[bus] pipeline failure', err));

    return event;
  }

  /** Subscribe one or many types. Returns unsubscribe. */
  subscribe(types: PlatformEventType | PlatformEventType[], name: string, handler: EventHandler<any>): () => void {
    return subscriberRegistry.register(name, Array.isArray(types) ? types : [types], handler);
  }
}