import type { TimeWindow } from '../types/routeOptimization.types';

export interface OptimizationStop {
  buildingId: string;
  latitude: number;
  longitude: number;
  priority?: number;
  serviceDurationMinutes?: number;
  zoneId?: string;
  wasteVolume?: number;          // future: capacity planning
  preferredTimeWindow?: TimeWindow;
}