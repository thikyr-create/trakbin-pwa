// lib/core/field-intelligence/events/fieldEventHandlers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { fieldEventRepository, mapActivityRow } from '../storage/fieldEventRepository';
import { fieldEventPublisher } from './fieldEventPublisher';
import { FIELD_INTERNAL_EVENTS } from './fieldEventTypes';

/**
 * Live ingestion: mirrors driver_activity inserts into field_events.
 * Durable backstop: the C6 cron replays anything missed (offline, refresh, other device).
 * Returns a stop function.
 */
export function startFieldIntelligenceListener(client: SupabaseClient): () => void {
  const channel = client
    .channel('field_intelligence_ingestion')
    .on(
      'postgres_changes' as any,
      { event: 'INSERT', schema: 'public', table: 'driver_activity' },
      async (msg: any) => {
        const raw = mapActivityRow(msg.new);
        if (!raw) return;
        const saved = await fieldEventRepository.record(raw, client).catch(() => false);
        if (saved) await fieldEventPublisher.emit(FIELD_INTERNAL_EVENTS.RAW_EVENT_RECORDED, raw);
      }
    )
    .subscribe();

  return () => { client.removeChannel(channel); };
}