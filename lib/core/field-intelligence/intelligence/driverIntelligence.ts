// lib/core/field-intelligence/intelligence/driverIntelligence.ts
import { signalRepository } from '../storage/signalRepository';
import { intelligenceRepository } from '../storage/intelligenceRepository';
import { clamp01 } from '../models/ConfidenceScore';

/**
 * Learned observation-reliability profile per driver.
 * Explicitly NOT performance scoring — feeds confidence weighting only.
 */
export const driverIntelligence = {
  async learn(companyId: number, sinceIso: string): Promise<number> {
    const [honesty, efficiency, stops] = await Promise.all([
      signalRepository.listByCompany(companyId, sinceIso, 'arrival_accuracy'),
      signalRepository.listByCompany(companyId, sinceIso, 'route_efficiency'),
      signalRepository.listByCompany(companyId, sinceIso, 'stop_duration'),
    ]);

    const drivers = new Set([...honesty, ...efficiency, ...stops].map((s: any) => s.entity_id));
    let n = 0;
    for (const driverId of drivers) {
      const h = honesty.filter((s: any) => s.entity_id === driverId);
      const e = efficiency.filter((s: any) => s.entity_id === driverId);
      const st = stops.filter((s: any) => s.entity_id === driverId);

      const avg = (list: any[]) => list.length ? list.reduce((s, x) => s + Number(x.value), 0) / list.length : null;
      const samples = h.length + e.length + st.length;
      const reliability = Math.max(0, ...[...h, ...e].map((x: any) => Number(x.confidence)), 0);

      await intelligenceRepository.upsert(companyId, 'driver', driverId, 'collection_pattern', {
        arrivalHonesty: avg(h),
        gpsQuality: avg(e),
        avgStopMin: st.length ? Math.round(avg(st)!) : null,
      }, clamp01(reliability), samples, undefined, reliability >= 0.7 && samples >= 10 ? 'active' : 'candidate');
      n++;
    }
    return n;
  },
};