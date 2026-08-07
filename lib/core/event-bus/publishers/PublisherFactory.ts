import { bus } from '../bus/instance';
import type { EventPublisher } from '../contracts/EventPublisher';

export function createPublisher(source: string): EventPublisher {
  return {
    source,
    publish(type, payload, ctx) {
      bus.publish({ type, source, payload, ...ctx });
    },
  };
}