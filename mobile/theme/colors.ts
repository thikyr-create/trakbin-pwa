// mobile/theme/colors.ts
export const colors = {
  primary: '#059669',        // emerald-600 — buttons, active nav
  primaryPressed: '#047857', // emerald-700
  primarySoft: '#ecfdf5',    // emerald-50
  primaryRing: '#a7f3d0',    // emerald-200
  brandDeep: '#064e3b',      // splash / dark gradient start
  brandDarker: '#022c22',    // emerald-950 — command surfaces

  background: '#f6f7f6',     // app canvas (web exact)
  card: '#ffffff',
  inputBg: '#f9fafb',        // gray-50

  textPrimary: '#111827',    // gray-900
  textSecondary: '#4b5563',  // gray-600
  textMuted: '#6b7280',      // gray-500
  textFaint: '#9ca3af',      // gray-400

  border: '#e5e7eb',         // gray-200
  borderSoft: '#f3f4f6',     // gray-100

  success: '#047857', successBg: '#ecfdf5',
  warning: '#b45309', warningBg: '#fffbeb', warningDot: '#f59e0b',
  danger: '#dc2626',  dangerBg: '#fff1f2',
  info: '#0369a1',    infoBg: '#f0f9ff',
} as const;