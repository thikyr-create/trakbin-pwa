export const colors = {
  // STAGE
  bg: '#0F1310',                  // dark graphite
  surface: '#1A1F1C',             // default card surface
  surfaceMuted: '#242925',        // secondary surfaces, inputs
  surfaceElevated: '#2A302C',     // sheets, modals
  inverse: '#FFFFFF',

  text: {
    primary: '#FFFFFF',
    secondary: '#DDE4E0',
    muted: '#9AA6A0',
    inverse: '#FFFFFF',
  },

  border: {
    subtle: '#2D332F',
    strong: '#3A413C',
    focus: '#15A970',
  },

  // EMERALD — vibrant #15A970 core, teal undertone, premium-deep top
  brand: {
    50:  '#ECFBF4',
    100: '#D2F6E6',
    200: '#A8ECD0',
    300: '#72DDB4',
    400: '#3BC793',
    500: '#15A970',  // vibrant emerald (anchor)
    600: '#12915F',  // primary CTAs
    700: '#0F754E',
    800: '#0D5C3F',
    900: '#0B4B34',  // deep emerald
  },

  // CARD PALETTE VARIANTS — multi-color card language
  card: {
    emerald: '#15A970',   // wallet & brand signatures
    navy:    '#1E293B',   // provider identity, deep content
    graphite:'#1F2321',   // default/empty cards
    amber:   '#B45309',   // billing, warnings
    slate:   '#334155',   // secondary content
    rose:    '#BE123C',   // overdue, danger highlights
  },

  state: {
    success:    '#15A970',
    successSoft:'#0B2E21',
    warning:    '#F59E0B',
    warningSoft:'#3D2A0A',
    danger:     '#EF4444',
    dangerSoft: '#3D0F0F',
    info:       '#3B82F6',
    infoSoft:   '#0F1E3D',
  },

  map: {
    route: '#12915F',
    user:  '#3B82F6',
    stop:  '#15A970',
  },

  // TRANSLUCENT MATERIAL — frosted glass on graphite (new architecture)
  material: {
    surface: 'rgba(255,255,255,0.06)',
    surfaceStrong: 'rgba(255,255,255,0.10)',
    border: 'rgba(255,255,255,0.10)',
    emerald: 'rgba(21,169,112,0.10)',
    emeraldBorder: 'rgba(21,169,112,0.28)',
  },
} as const;