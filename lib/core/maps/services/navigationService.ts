// lib/core/maps/services/navigationService.ts
import type { NavigationProvider } from '../interfaces/navigationProvider';
import type { Coordinates, NavigationInstruction } from '../types';
import { MapboxNavigation } from '../providers/mapbox/mapboxNavigation';
const provider: NavigationProvider = new MapboxNavigation();
export const navigationService = { async getInstructions(p: Coordinates[]): Promise<NavigationInstruction[]> { return provider.getInstructions(p); } };
