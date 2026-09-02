import { fonts } from './fonts';

export const text = {
  // DISPLAY — Sora, architectural
  display: { fontSize: 34, lineHeight: 40, fontFamily: fonts.display, letterSpacing: -0.5 },
  titleL: { fontSize: 24, lineHeight: 30, fontFamily: fonts.display, letterSpacing: -0.3 },
  titleM: { fontSize: 20, lineHeight: 26, fontFamily: fonts.display, letterSpacing: -0.2 },
  titleS: { fontSize: 17, lineHeight: 22, fontFamily: fonts.display },

  // LABELS — uppercase micro
  eyebrow: { fontSize: 11, lineHeight: 14, fontFamily: fonts.bodyBold, letterSpacing: 2, textTransform: 'uppercase' as const },
  label: { fontSize: 11, lineHeight: 14, fontFamily: fonts.bodyBold, letterSpacing: 1.5, textTransform: 'uppercase' as const },

  // BODY — Plus Jakarta, readable
  bodyL: { fontSize: 16, lineHeight: 22, fontFamily: fonts.body },
  bodyM: { fontSize: 14, lineHeight: 20, fontFamily: fonts.body },
  bodyS: { fontSize: 12, lineHeight: 16, fontFamily: fonts.body },
  bodyXs: { fontSize: 11, lineHeight: 14, fontFamily: fonts.body },
  semibold: { fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi },
  button: { fontSize: 15, lineHeight: 20, fontFamily: fonts.bodyBold },
  headingM: { fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyBold },
  headingL: { fontSize: 20, lineHeight: 26, fontFamily: fonts.bodyBold },
  caption: { fontSize: 11, lineHeight: 14, fontFamily: fonts.body },

  // MONO — IDs, codes, coordinates
  mono: { fontSize: 12, lineHeight: 16, fontFamily: fonts.mono },
  monoBold: { fontSize: 13, lineHeight: 18, fontFamily: fonts.monoBold },
} as const;