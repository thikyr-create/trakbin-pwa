// lib/core/field-intelligence/analyzers/routeAnalyzer.ts
import { observationRepository } from '../storage/observationRepository';
import { breadcrumbRepository, type Breadcrumb } from '../storage/breadcrumbRepository';
import { signalRepository } from '../storage/signalRepository';
import { routeProcessor } from '../processors/routeProcessor';
import { buildSignal } from '../models/FieldSignal';
import { routeConfidenceEngine } from '../confidence/routeConfidenceEngine';
import { clamp01 } from '../models/ConfidenceScore';
import type { FieldSignal } from '../models/FieldSignal';

/** Haversine distance in meters between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Compute total distance + total duration from a sorted breadcrumb array */
function computeBreadcrumbMetrics(bcs: Breadcrumb[]): {
  totalDistanceM: number;
  movingTimeMs: number;
  avgAccuracyM: number | null;
} {
  if (bcs.length < 2) {
    return {
      totalDistanceM: 0,
      movingTimeMs: 0,
      avgAccuracyM: bcs[0]?.accuracy_m ?? null,
    };
  }
  let totalDistanceM = 0;
  let accSum = 0;
  let accCount = 0;
  
  for (let i = 1; i < bcs.length; i++) {
    const prev = bcs[i - 1];
    const curr = bcs[i];
    if (!prev || !curr) continue; // Explicit guard for TS
    
    totalDistanceM += haversineMeters(
      prev.lat, prev.lng,
      curr.lat, curr.lng
    );
    
    if (curr.accuracy_m != null) {
      accSum += curr.accuracy_m;
      accCount++;
    }
  }
  
  const first = new Date(bcs[0].recorded_at).getTime();
  const last = new Date(bcs[bcs.length - 1].recorded_at).getTime();
  return {
    totalDistanceM: Math.round(totalDistanceM),
    movingTimeMs: Math.max(0, last - first),
    avgAccuracyM: accCount > 0 ? Math.round(accSum / accCount) : null,
  };
}

/** Answers: how long do routes actually take, how much time is lost to deviation, and what distance is actually driven? */
export const routeAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    // ─── 1. Discrete observations (existing path) ───
    const obs = (await observationRepository.listByCompany(companyId, sinceIso))
      .filter((o: any) => o.occurred_at <= untilIso && o.kind === 'route');

    const byRoute = new Map<string, any[]>();
    for (const o of obs) {
      const key = o.route_id || 'unknown';
      if (!byRoute.has(key)) byRoute.set(key, []);
      byRoute.get(key)!.push(o);
    }

    // ─── 2. Raw breadcrumbs (new path) ───
    // Fetch ALL breadcrumbs for the company in the window; group by route_id.
    // This powers the "actual distance driven" and "actual moving time" signals.
    const allBreadcrumbs = await breadcrumbRepository.listByCompany(companyId, sinceIso, untilIso);
    const bcByRoute = new Map<string, Breadcrumb[]>();
    for (const bc of allBreadcrumbs) {
      if (!bc.route_id) continue;
      if (!bcByRoute.has(bc.route_id)) bcByRoute.set(bc.route_id, []);
      bcByRoute.get(bc.route_id)!.push(bc);
    }

    // Merge route keys from both sources so breadcrumbs-only routes still get analyzed
    const allRouteIds = new Set<string>([...byRoute.keys(), ...bcByRoute.keys()]);

    const signals: FieldSignal[] = [];
    for (const routeId of allRouteIds) {
      if (routeId === 'unknown') continue;

      const routeObs = byRoute.get(routeId) || [];
      const routeBreadcrumbs = bcByRoute.get(routeId) || [];

      // ─── A. Observation-based signals (existing logic, preserved) ───
      if (routeObs.length > 0) {
        const sorted = routeObs.sort((a: any, b: any) => a.occurred_at.localeCompare(b.occurred_at));
        const start = sorted.find((o: any) => o.payload?.phase === 'started');
        const end = sorted.find((o: any) => o.payload?.phase === 'completed');
        const episodes = routeProcessor.deviationEpisodes(routeObs);
        const deviatedMs = episodes.reduce((s, e) => s + (e.durationMs ?? 0), 0);

        if (start && end) {
          const durationMs = new Date(end.occurred_at).getTime() - new Date(start.occurred_at).getTime();
          if (durationMs > 0) {
            const adherence = Math.max(0, 1 - deviatedMs / durationMs);
            const conf = routeConfidenceEngine.score({
              samples: sorted.length,
              adherence,
            }).score;

            const out: FieldSignal[] = [
              buildSignal(companyId, 'route', routeId, 'travel_time', Math.round(durationMs / 60000), conf, sinceIso, untilIso, [], { deviatedMs }),
              buildSignal(companyId, 'route', routeId, 'route_efficiency', adherence, conf, sinceIso, untilIso),
            ];
            for (const s of out) await signalRepository.insert(s);
            signals.push(...out);
          }
        }
      }

      // ─── B. Breadcrumb-based signals (new) ───
      // Actual distance driven + actual moving time — derived from GPS breadcrumbs.
      // These give the VRP ground truth: how far the truck actually drove, and how long.
      if (routeBreadcrumbs.length >= 2) {
        const m = computeBreadcrumbMetrics(routeBreadcrumbs);

        // Confidence scales with breadcrumb count; 100+ points = full confidence.
        const bcConf = clamp01(routeBreadcrumbs.length / 100);

        const out: FieldSignal[] = [
          buildSignal(
            companyId, 'route', routeId, 'route_distance', // New SignalKind
            m.totalDistanceM, bcConf, sinceIso, untilIso, [],
            {
              breadcrumbCount: routeBreadcrumbs.length,
              avgAccuracyM: m.avgAccuracyM,
              movingTimeMin: Math.round(m.movingTimeMs / 60000),
            }
          ),
          buildSignal(
            companyId, 'route', routeId, 'route_duration', // New SignalKind
            Math.round(m.movingTimeMs / 60000), bcConf, sinceIso, untilIso, [],
            {
              breadcrumbCount: routeBreadcrumbs.length,
              totalDistanceM: m.totalDistanceM,
            }
          ),
        ];
        for (const s of out) await signalRepository.insert(s);
        signals.push(...out);
      }
    }

    return signals;
  },
};