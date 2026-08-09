// lib/core/field-intelligence/models/MovementObservation.ts
export interface MovementObservation {
  lat: number;
  lng: number;
  ts: string;
  accuracy?: number | null;
  speedKmh?: number | null;
  heading?: number | null;
}