// lib/core/field-intelligence/policies/observationPolicy.ts
import { gpsConfig } from '../config/gpsConfig';

/** Gates what the engine is allowed to consider at all. */
export const observationPolicy = {
  canIngest(raw: { latitude?: number | null; longitude?: number | null; metadata?: any }): boolean {
    if (raw.latitude == null || raw.longitude == null) return true; // non-GPS events pass
    if (Math.abs(raw.latitude) > 90 || Math.abs(raw.longitude) > 180) return false;
    const acc = raw.metadata?.accuracy ?? raw.metadata?.gps_accuracy;
    if (typeof acc === 'number' && acc > gpsConfig.accuracyCeilingM) return false;
    return true;
  },

  canUseForLearning(obs: any): boolean {
    if (obs.latitude == null || obs.longitude == null) return false;
    if (obs.gps_accuracy != null && obs.gps_accuracy > gpsConfig.accuracyCeilingM) return false;
    return true;
  },
};