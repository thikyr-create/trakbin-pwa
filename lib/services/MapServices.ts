// lib/services/MapServices.ts
import { Building, RouteResult, NavigationResult } from './types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export const RouteService = {
  // Optimizes the order of buildings (Simple nearest-neighbor for now)
  async getTodaysRoute(driverId: string, buildings: Building[]): Promise<RouteResult> {
    // In a real app, you'd call your backend to get the optimized route.
    // For now, we return the buildings as they are.
    return {
      buildings,
      totalDistance: 0,
      estimatedTime: 0
    };
  }
};

export const NavigationService = {
  // Gets turn-by-turn directions from Mapbox
  async getDirections(origin: [number, number], destination: [number, number]): Promise<NavigationResult> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          duration: route.duration,
          distance: route.distance,
          geometry: route.geometry
        };
      }
      throw new Error('No route found');
    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
    }
  }
};