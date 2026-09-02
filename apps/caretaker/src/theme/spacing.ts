export const sp = {
  x05: 2,
  x1: 4,
  x15: 6,
  x2: 8,
  x25: 10,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x7: 28,
  x8: 32,
  x10: 40,
  x12: 48,
  x16: 64,
} as const;

export const gutter = 20;

// Touch-target sizes (generous, per design system)
export const touch = {
  min: 44,   // minimum tappable
  field: 52, // input height
  cta: 56,   // primary button height
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
  // legacy aliases (safe)
  card: 20,
  cardLg: 28,
  input: 12,
  button: 14,
  chip: 999,
} as const;