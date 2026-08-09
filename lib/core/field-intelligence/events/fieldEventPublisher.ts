// lib/core/field-intelligence/events/fieldEventPublisher.ts
type Handler = (payload: any) => void | Promise<void>;

const listeners = new Map<string, Set<Handler>>();

/**
 * Internal FI emitter. Decoupled from the Platform Event Bus on purpose:
 * FI events are high-frequency internal pipeline events, not platform events.
 * Platform-visible outcomes (FIELD_INTELLIGENCE_LEARNED) are published
 * separately by the feedback layer (C6).
 */
export const fieldEventPublisher = {
  on(event: string, handler: Handler): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  },

  async emit(event: string, payload: any): Promise<void> {
    const handlers = listeners.get(event);
    if (!handlers) return;
    for (const h of handlers) {
      try { await h(payload); } catch (e) { console.error('[field-intelligence] handler failed', event, e); }
    }
  },
};