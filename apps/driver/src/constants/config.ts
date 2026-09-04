export const MAP_CONFIG = {
  defaultCenter: [3.3792, 6.5244] as [number, number],
  defaultZoom: 15,
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  maxZoom: 19,
  minZoom: 10,
};

export const GPS_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export const BREADCRUMB_CONFIG = {
  minTimeMs: 15000,       // record at least every 15s
  minDistanceM: 30,       // OR if moved 30m
  batchSize: 20,          // flush to DB every 20 points
  flushIntervalMs: 60000, // or flush every 60s
};