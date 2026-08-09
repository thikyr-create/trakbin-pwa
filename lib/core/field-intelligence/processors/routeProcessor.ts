// lib/core/field-intelligence/processors/routeProcessor.ts
import type { FieldObservation } from '../models/FieldObservation';

export interface DeviationEpisode {
  driverId: string;
  routeId: string | null;
  startedAt: string;
  endedAt: string | null;
  maxDistanceM: number;
  durationMs: number | null;
}

export const routeProcessor = {
  /** Pair deviated → rejoined into episodes; close open episodes at route completion. */
  deviationEpisodes(routeObservations: FieldObservation[]): DeviationEpisode[] {
    const obs = routeObservations
      .filter((o) => o.kind === 'route')
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    const episodes: DeviationEpisode[] = [];
    let open: DeviationEpisode | null = null;

    for (const o of obs) {
      const phase = o.payload?.phase;
      if (phase === 'deviated') {
        if (open) episodes.push(open); // superseded
        open = {
          driverId: o.driverId,
          routeId: o.routeId ?? null,
          startedAt: o.occurredAt,
          endedAt: null,
          maxDistanceM: Number(o.payload?.distanceM ?? 0),
          durationMs: null,
        };
      } else if (phase === 'rejoined' && open) {
        open.endedAt = o.occurredAt;
        open.durationMs = new Date(o.occurredAt).getTime() - new Date(open.startedAt).getTime();
        open.maxDistanceM = Math.max(open.maxDistanceM, Number(o.payload?.distanceM ?? 0));
        episodes.push(open);
        open = null;
      } else if (phase === 'completed' && open) {
        open.endedAt = o.occurredAt;
        open.durationMs = new Date(o.occurredAt).getTime() - new Date(open.startedAt).getTime();
        episodes.push(open);
        open = null;
      }
    }
    if (open) episodes.push(open);
    return episodes;
  },
};