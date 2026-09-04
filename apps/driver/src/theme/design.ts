import { Platform } from 'react-native';

// Material Design 3 inspired tokens with emerald green primary
export const colors = {
  // Primary palette (emerald)
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Neutral palette
  neutral: {
    0: '#ffffff',
    10: '#fafafa',
    20: '#f5f5f5',
    30: '#e5e5e5',
    40: '#d4d4d4',
    50: '#a3a3a3',
    60: '#737373',
    70: '#525252',
    80: '#404040',
    90: '#262626',
    100: '#171717',
  },
  
  // Semantic colors
  surface: {
    container: 'rgba(255, 255, 255, 0.85)',
    containerHigh: 'rgba(255, 255, 255, 0.92)',
    containerHighest: 'rgba(255, 255, 255, 0.98)',
    translucent: 'rgba(245, 240, 230, 0.75)', // Cream background
  },
  
  state: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  
  text: {
    primary: '#064e3b',
    secondary: '#525252',
    tertiary: '#737373',
    disabled: '#a3a3a3',
    inverse: '#ffffff',
  },
};

// Typography scale (MD3)
export const typography = {
  displayLarge: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-light' }),
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-light' }),
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
};

// Spacing scale (4dp base)
export const spacing = {
  x2: 2,
  x4: 4,
  x6: 6,
  x8: 8,
  x10: 10,
  x12: 12,
  x14: 14,
  x16: 16,
  x20: 20,
  x24: 24,
  x32: 32,
  x40: 40,
  x48: 48,
  x96: 96,
};

// Elevation (MD3 shadow layers)
export const elevation = {
  0: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  2: {
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  3: {
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  4: {
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Border radius scale
export const radius = {
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
};