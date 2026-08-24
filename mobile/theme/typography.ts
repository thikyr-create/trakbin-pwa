// mobile/theme/typography.ts
export const fonts = {
  display: 'Sora_700Bold',      // headings, extrabold/black via weight
  displayHeavy: 'Sora_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemibold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtrabold: 'PlusJakartaSans_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const text = {
  // The web "eyebrow": mono 10px uppercase tracking-[0.2em] text-gray-400
  eyebrow: { fontFamily: fonts.monoBold, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 2 },
  headingXl: { fontFamily: fonts.displayHeavy, fontSize: 32, letterSpacing: -0.5 },
  headingL: { fontFamily: fonts.displayHeavy, fontSize: 20, letterSpacing: -0.3 },
  headingM: { fontFamily: fonts.displayHeavy, fontSize: 17, letterSpacing: -0.2 },
  bodySm: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  bodyXs: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 11 },
} as const;