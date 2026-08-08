// lib/core/maps/interfaces/navigationProvider.ts
import type { Coordinates, NavigationInstruction } from '../types';
export interface NavigationProvider {
  readonly name: string;
  getInstructions(points: Coordinates[]): Promise<NavigationInstruction[]>;
}