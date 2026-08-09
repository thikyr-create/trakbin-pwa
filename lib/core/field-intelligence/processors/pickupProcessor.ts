// lib/core/field-intelligence/processors/pickupProcessor.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FieldObservation } from '../models/FieldObservation';
import { observationRepository } from '../storage/observationRepository';

const MAX_DWELL_MS = 4 * 60 * 60 * 1000; // 4h sanity ceiling

export const pickupProcessor = {
  /**
   * Attach dwell time to a confirmed pickup by finding the nearest prior
   * arrival observation at the same building. Mutates obs.payload in place.
   */
  async enrichDwell(obs: FieldObservation, client?: SupabaseClient): Promise<void> {
    if (obs.kind !== 'pickup' || obs.payload?.outcome !== 'confirmed' || !obs.buildingId) return;

    const arrivals = await observationRepository.listByBuilding(obs.companyId, obs.buildingId, 'arrival', 100, client);
    const confirmedAt = new Date(obs.occurredAt).getTime();

    const prior = arrivals
      .filter((a: any) => {
        const t = new Date(a.occurred_at).getTime();
        return t <= confirmedAt && confirmedAt - t <= MAX_DWELL_MS && a.payload?.phase === 'arrived';
      })
      .sort((a: any, b: any) => b.occurred_at.localeCompare(a.occurred_at))[0];

    if (prior) {
      obs.payload = {
        ...obs.payload,
        dwellMs: confirmedAt - new Date(prior.occurred_at).getTime(),
        arrivedAt: prior.occurred_at,
        arrivalDistanceM: prior.payload?.distanceM ?? null,
      };
    }
  },
};