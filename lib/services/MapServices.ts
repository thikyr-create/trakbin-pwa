// lib/services/MapServices.ts — legacy shim; delegates to core/maps
import { routingService } from '@/lib/core/maps';

export const RouteService = {
  async getTodaysRoute(_driverId: string, buildings: any[]) {
    return { buildings, totalDistance: 0, estimatedTime: 0 };
  },
};

export const NavigationService = {
  async getDirections(origin: [number, number], destination: [number, number]) {
    const r = await routingService.getRoute([
      { lng: origin[0], lat: origin[1] },
      { lng: destination[0], lat: destination[1] },
    ]);
    return { duration: r.durationMin * 60, distance: r.distanceKm * 1000, geometry: r.geometry };
  },
};