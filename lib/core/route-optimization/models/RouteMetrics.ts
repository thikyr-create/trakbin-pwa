export interface RouteMetrics {
  totalDistanceKm: number;
  travelTimeMin: number;
  serviceTimeMin: number;
  estimatedDurationMin: number;
  timeWindowViolations: number;
  priorityScore: number;
  score: number;                 // lower is better
}