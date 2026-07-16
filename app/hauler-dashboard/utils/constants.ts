export const THEME = {
  colors: {
    background: '#0f172a',
    accent: '#16A34A',
    accentGlow: 'rgba(22, 163, 74, 0.4)',
    white: '#ffffff',
    gray: '#94a3b8',
    darkGlass: 'rgba(15, 23, 42, 0.85)',
  },
  spacing: {
    cornerRadius: '18px',
    touchTarget: '44px',
  },
  shadows: {
    soft: '0 4px 20px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(22, 163, 74, 0.4)',
  },
};

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