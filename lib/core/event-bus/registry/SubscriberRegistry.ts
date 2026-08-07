import type { PlatformEventType } from '../events';
import type { EventHandler } from '../contracts/EventHandler';

interface Entry { name: string; handler: EventHandler<any>; }
const registry = new Map<string, Set<Entry>>();

export const subscriberRegistry = {
  register(name: string, types: PlatformEventType[], handler: EventHandler<any>): () => void {
    const added: Array<[string, Entry]> = [];
    for (const t of types) {
      if (!registry.has(t)) registry.set(t, new Set());
      const entry: Entry = { name, handler };
      registry.get(t)!.add(entry); added.push([t, entry]);
    }
    return () => { for (const [t, entry] of added) registry.get(t)?.delete(entry); };
  },
  resolve(type: string): Entry[] { return Array.from(registry.get(type) ?? []); },
};