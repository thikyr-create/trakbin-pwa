// lib/core/event-bus/platform-bus.ts
// In-process, synchronous-dispatch platform bus.
// One publisher, many subscribers: audit, comms, lifecycle all react to the same event.
type Handler = (payload: any) => void | Promise<void>;

const handlers = new Map<string, Handler[]>();

export function subscribe(topic: string, handler: Handler) {
  const list = handlers.get(topic) || [];
  list.push(handler);
  handlers.set(topic, list);
}

export async function publish(topic: string, payload: any) {
  for (const h of handlers.get(topic) || []) {
    try { await h(payload); } catch { /* a subscriber never breaks the publisher */ }
  }
}