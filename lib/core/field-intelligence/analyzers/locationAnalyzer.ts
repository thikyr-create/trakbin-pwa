// lib/core/field-intelligence/analyzers/locationAnalyzer.ts
import { createClient } from '@supabase/supabase-js';
import { observationRepository } from '../storage/observationRepository';
import { signalRepository } from '../storage/signalRepository';
import { buildSignal } from '../models/FieldSignal';
import { clamp01 } from '../models/ConfidenceScore';
import { confidenceConfig } from '../config/confidenceConfig';
import { haversineKm } from '@/lib/core/route-optimization/routing/routeMatrix';
import type { FieldSignal } from '../models/FieldSignal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface BuildingPoint { lat: number; lng: number; }

/** Shared building geometry lookup for all analyzers. */
export async function listCompanyBuildingPoints(companyId: number): Promise<Map<string, BuildingPoint>> {
  const { data } = await supabase.from('buildings')
    .select('building_id, latitude, longitude')
    .eq('company_id', companyId);
  const map = new Map<string, BuildingPoint>();
  for (const b of data || []) {
    if (b.latitude != null && b.longitude != null) {
      map.set(b.building_id, { lat: Number(b.latitude), lng: Number(b.longitude) });
    }
  }
  return map;
}

function offsetM(a: BuildingPoint, lat: number, lng: number): number {
  return haversineKm({ latitude: a.lat, longitude: a.lng }, { latitude: lat, longitude: lng }) * 1000;
}

/**
 * Answers: is the stored building location consistent with repeated real-world
 * observations? Emits location_accuracy signals (value = mean offset meters).
 */
export const locationAnalyzer = {
  async analyze(companyId: number, sinceIso: string, untilIso: string): Promise<FieldSignal[]> {
    const [obs, points] = await Promise.all([
      observationRepository.listByCompany(companyId, sinceIso),
      listCompanyBuildingPoints(companyId),
    ]);

    const byBuilding = new Map<string, { offsets: number[]; ids: number[]; corrections: number }>();
    for (const o of obs) {
      if (o.occurred_at > untilIso || o.latitude == null || o.longitude == null || !o.building_id) continue;
      const stored = points.get(o.building_id);
      if (!stored) continue;
      const isCorrection = o.payload?.correction === true;
      const isUsable = isCorrection || o.kind === 'arrival' || (o.kind === 'pickup' && o.payload?.outcome === 'confirmed');
      if (!isUsable) continue;

      if (!byBuilding.has(o.building_id)) byBuilding.set(o.building_id, { offsets: [], ids: [], corrections: 0 });
      const agg = byBuilding.get(o.building_id)!;
      agg.offsets.push(offsetM(stored, Number(o.latitude), Number(o.longitude)));
      agg.ids.push(o.id);
      if (isCorrection) agg.corrections++;
    }

    const signals: FieldSignal[] = [];
    for (const [buildingId, agg] of byBuilding) {
      if (agg.offsets.length === 0) continue;
      const mean = agg.offsets.reduce((s, x) => s + x, 0) / agg.offsets.length;
      const variance = agg.offsets.reduce((s, x) => s + (x - mean) ** 2, 0) / agg.offsets.length;
      const std = Math.sqrt(variance);
      // Consistency bonus: tight cluster = stronger signal; corrections weigh more
      const consistency = clamp01(1 - Math.min(std, 200) / 200);
      const sampleConf = clamp01(agg.offsets.length / confidenceConfig.minSamples.promote);
      const confidence = clamp01(0.5 * sampleConf + 0.5 * consistency + 0.1 * clamp01(agg.corrections / 3));

      const sig = buildSignal(companyId, 'building', buildingId, 'location_accuracy', Math.round(mean), confidence, sinceIso, untilIso, agg.ids, { stdM: Math.round(std), samples: agg.offsets.length, corrections: agg.corrections });
      await signalRepository.insert(sig);
      signals.push(sig);
    }
    return signals;
  },
};