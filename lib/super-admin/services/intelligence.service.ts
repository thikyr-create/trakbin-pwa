// lib/super-admin/services/intelligence.service.ts
import { adminSupabase as supabase } from '../supabase/client';

export interface NormalizedObservation {
  id: string;
  building: string | null;
  kind: string | null;
  confidence: number | null;
  status: string | null;
  at: string | null;
}

export interface NormalizedCorrection {
  id: string;
  building: string | null;
  kind: string | null;
  status: string | null;
  at: string | null;
}

export interface IntelligenceOverview {
  totals: { observations: number; signals: number; events: number; feedback: number; corrections: number; intelligence: number };
  observations: NormalizedObservation[];
  corrections: NormalizedCorrection[];
  confidence: { high: number; medium: number; low: number; unknown: number };
  patterns: { key: string; count: number }[];
  quality: { withConfidence: number; total: number; correctionsApplied: number; correctionsTotal: number };
}

// Defensive extraction — the FI engine owns the schema; the console reads what exists
const pick = (row: any, keys: string[]): any => {
  for (const k of keys) if (row?.[k] != null) return row[k];
  return null;
};

function normalizeObservation(o: any): NormalizedObservation {
  const conf = pick(o, ['confidence', 'confidence_score', 'score']);
  return {
    id: String(pick(o, ['id']) ?? ''),
    building: pick(o, ['building_id', 'custom_id', 'node_id']),
    kind: pick(o, ['type', 'observation_type', 'kind', 'signal_type']),
    confidence: conf != null && !isNaN(Number(conf)) ? Number(conf) : null,
    status: pick(o, ['status', 'state']),
    at: pick(o, ['created_at', 'observed_at', 'timestamp']),
  };
}

function normalizeCorrection(c: any): NormalizedCorrection {
  return {
    id: String(pick(c, ['id']) ?? ''),
    building: pick(c, ['building_id', 'custom_id', 'node_id']),
    kind: pick(c, ['type', 'correction_type', 'field', 'kind']),
    status: pick(c, ['status', 'state']),
    at: pick(c, ['created_at', 'applied_at', 'timestamp']),
  };
}

export async function getIntelOverview(): Promise<IntelligenceOverview> {
  const [obs, sig, ev, fb, cor, intel] = await Promise.all([
    supabase.from('field_observations').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('field_signals').select('*', { count: 'exact', head: true }),
    supabase.from('field_events').select('*', { count: 'exact', head: true }),
    supabase.from('field_feedback').select('*', { count: 'exact', head: true }),
    supabase.from('field_corrections').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('field_intelligence').select('*', { count: 'exact', head: true }),
  ]);

  const observations = (obs.data || []).map(normalizeObservation);
  const corrections = (cor.data || []).map(normalizeCorrection);

  const confidence = { high: 0, medium: 0, low: 0, unknown: 0 };
  observations.forEach((o) => {
    if (o.confidence == null) confidence.unknown++;
    else if (o.confidence >= 0.8) confidence.high++;
    else if (o.confidence >= 0.5) confidence.medium++;
    else confidence.low++;
  });

  const byBuilding = new Map<string, number>();
  observations.forEach((o) => {
    const k = o.building || 'unattributed';
    byBuilding.set(k, (byBuilding.get(k) || 0) + 1);
  });
  const patterns = [...byBuilding.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const applied = corrections.filter((c) => ['applied', 'approved', 'completed'].includes(String(c.status)));

  return {
    totals: {
      observations: observations.length,
      signals: sig.count || 0,
      events: ev.count || 0,
      feedback: fb.count || 0,
      corrections: corrections.length,
      intelligence: intel.count || 0,
    },
    observations: observations.slice(0, 30),
    corrections: corrections.slice(0, 20),
    confidence,
    patterns,
    quality: {
      withConfidence: observations.filter((o) => o.confidence != null).length,
      total: observations.length,
      correctionsApplied: applied.length,
      correctionsTotal: corrections.length,
    },
  };
}