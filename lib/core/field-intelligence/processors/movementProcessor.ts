// lib/core/field-intelligence/processors/movementProcessor.ts
import type { FieldObservation } from '../models/FieldObservation';
import { processingConfig } from '../config/processingConfig';
import { gpsConfig as gps } from '../config/gpsConfig';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';

export interface MovementSegment {
  driverId: string;
  startTs: string;
  endTs: string;
  distanceM: number;
  durationMs: number;
  avgSpeedKmh: number;
  stoppedMs: number;
  points: number;
}

export interface DetectedStop {
  driverId: string;
  lat: number;
  lng: number;
  startTs: string;
  endTs: string;
  dwellMs: number;
}

export const movementProcessor = {
  /**
   * Split a driver's movement observations into clean segments; filter GPS
   * outliers; detect stops via dwell. Uses the canonical haversineKm from
   * route-optimization (returns km; converted to meters here).
   */
  segmentize(observations: FieldObservation[]): {
    segments: MovementSegment[];
    stops: DetectedStop[];
  } {
    const pts = observations
      .filter((o) => o.kind === 'movement' && o.latitude != null && o.longitude != null)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    const segments: MovementSegment[] = [];
    const stops: DetectedStop[] = [];

    let cur: MovementSegment | null = null;
    let prev: FieldObservation | null = null;
    let runStart: FieldObservation | null = null;
    let runLat = 0;
    let runLng = 0;
    let runN = 0;

    const flushStop = (end: FieldObservation) => {
      if (!runStart) return;
      const dwellMs = new Date(end.occurredAt).getTime() - new Date(runStart.occurredAt).getTime();
      if (dwellMs >= processingConfig.minDwellMs) {
        stops.push({
          driverId: end.driverId,
          lat: runLat / runN,
          lng: runLng / runN,
          startTs: runStart.occurredAt,
          endTs: end.occurredAt,
          dwellMs,
        });
      }
      runStart = null;
      runLat = 0;
      runLng = 0;
      runN = 0;
    };

    for (const p of pts) {
      if (prev) {
        const dtMs = new Date(p.occurredAt).getTime() - new Date(prev.occurredAt).getTime();

        // Gap → new segment
        if (dtMs > processingConfig.maxPingGapMs || dtMs < 0) {
          if (cur) segments.push(cur);
          cur = null;
          flushStop(prev);
        } else {
          const distKm = haversineKm(
            { latitude: prev.latitude!, longitude: prev.longitude! },
            { latitude: p.latitude!, longitude: p.longitude! }
          );
          const dist = distKm * 1000; // km → meters
          const speedKmh = (dist / Math.max(dtMs, 1)) * 3600;

          // Outlier gates
          const jump = dist > gps.pingJumpOutlierM && dtMs < 10_000;
          if (!jump && speedKmh <= gps.impossibleSpeedKmh) {
            if (!cur) {
              cur = {
                driverId: p.driverId,
                startTs: prev.occurredAt,
                endTs: p.occurredAt,
                distanceM: 0,
                durationMs: 0,
                avgSpeedKmh: 0,
                stoppedMs: 0,
                points: 1,
              };
            }
            cur.distanceM += dist;
            cur.durationMs += dtMs;
            cur.endTs = p.occurredAt;
            cur.points += 1;
            cur.avgSpeedKmh = (cur.distanceM / Math.max(cur.durationMs, 1)) * 3600;

            // Dwell detection
            if (speedKmh < gps.stopSpeedKmh) {
              if (!runStart) {
                runStart = prev;
                runLat = 0;
                runLng = 0;
                runN = 0;
              }
              runLat += p.latitude!;
              runLng += p.longitude!;
              runN += 1;
              cur.stoppedMs += dtMs;
            } else {
              flushStop(p);
            }
          }
        }
      }
      prev = p;
    }
    if (cur) segments.push(cur);
    if (prev) flushStop(prev);

    return { segments, stops };
  },
};