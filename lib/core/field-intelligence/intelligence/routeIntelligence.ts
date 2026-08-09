// lib/core/field-intelligence/intelligence/routeIntelligence.ts
import { signalRepository } from '../storage/signalRepository';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { confidenceAggregator } from '../confidence/confidenceAggregator';

/** Learned route performance: real duration, efficiency, deviation patterns. */
export const routeIntelligence = {
  async learn(companyId: number, sinceIso: string): Promise<number> {
    const [times, effs, devs, roads] = await Promise.all([
      signalRepository.listByCompany(companyId, sinceIso, 'travel_time'),
      signalRepository.listByCompany(companyId, sinceIso, 'route_efficiency'),
      signalRepository.listByCompany(companyId, sinceIso, 'route_deviation'),
      signalRepository.listByCompany(companyId, sinceIso, 'road_behavior'),
    ]);

    const routes = new Set([...times, ...effs, ...devs, ...roads].map((s: any) => s.entity_id));
    let n = 0;
    for (const routeId of routes) {
      const t = times.filter((s: any) => s.entity_id === routeId);
      const e = effs.filter((s: any) => s.entity_id === routeId);
      const d = devs.filter((s: any) => s.entity_id === routeId);
      const r = roads.filter((s: any) => s.entity_id === routeId);

      const avgMin = t.length ? Math.round(t.reduce((s: number, x: any) => s + Number(x.value), 0) / t.length) : null;
      const avgEff = e.length ? e.reduce((s: number, x: any) => s + Number(x.value), 0) / e.length : null;
      const episodes = d.reduce((s: number, x: any) => s + 1, 0) + r.reduce((s: number, x: any) => s + Number(x.value), 0);
      const samples = t.length + e.length + d.length + r.length;
      const confidence = Math.max(0, ...[...t, ...e, ...d, ...r].map((x: any) => Number(x.confidence)));

      await intelligenceRepository.upsert(companyId, 'route', routeId, 'travel_time', {
        avgDurationMin: avgMin,
        avgEfficiency: avgEff != null ? Math.round(avgEff * 100) / 100 : null,
      }, confidence, samples, undefined, confidenceAggregator.statusFor(confidence, samples) === 'verified' ? 'active' : 'candidate');

      if (episodes > 0) {
        await intelligenceRepository.upsert(companyId, 'route', routeId, 'deviation_pattern', {
          episodes,
          avgMaxDistanceM: Math.round(d.reduce((s: number, x: any) => s + Number(x.value), 0) / Math.max(d.length, 1)),
          recurring: r.length > 0,
        }, confidence, samples, undefined, 'candidate');
      }
      n++;
    }
    return n;
  },
};