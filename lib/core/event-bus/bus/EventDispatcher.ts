import { subscriberRegistry } from '../registry/SubscriberRegistry';
import { EventExecutor } from './EventExecutor';
import type { EventEnvelope } from '../contracts/Event';
import type { HistoryEntry } from '../history/EventStore';

export class EventDispatcher {
  constructor(private executor: EventExecutor) {}
  async dispatch(event: EventEnvelope, entry: HistoryEntry): Promise<void> {
    const targets = subscriberRegistry.resolve(event.type);
    await Promise.all(targets.map((t) => this.executor.execute(t.name, () => t.handler(event as any), event, entry)));
  }
}