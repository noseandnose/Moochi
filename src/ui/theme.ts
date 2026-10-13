/**
 * Design tokens. A restrained warm palette with sage and stone accents so the
 * pixel characters stay the most colourful thing on screen.
 */
export const colors = {
  background: '#FAF9F6',
  surface: '#FFFEFA',
  surfaceMuted: '#F2F1EB',
  surfaceSunken: '#ECEBE4',
  ink: '#20231F',
  inkSoft: '#4B4F47',
  inkMuted: '#666B62',
  inkFaint: '#868B82',
  line: '#E3E2DA',
  lineStrong: '#CFCFC4',
  sage: '#7E9A80',
  sageDeep: '#5F7A62',
  sageSoft: '#DCE5D9',
  olive: '#8A8F5C',
  stone: '#B9B4A6',
  stoneSoft: '#E9E5DA',
  water: '#5F9BB4',
  waterSoft: '#DCEBF1',
  move: '#C8744F',
  moveSoft: '#F6E3D9',
  eat: '#79975A',
  eatSoft: '#E3EBD9',
  bonus: '#C9A542',
  bonusSoft: '#F5ECD2',
  coin: '#D4A73A',
  danger: '#B5534A',
  dangerSoft: '#F4DEDB',
  success: '#5F7A62',
  overlay: 'rgba(32,35,31,0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 20,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.4 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 19, fontWeight: '400' as const },
  smallStrong: { fontSize: 14, lineHeight: 19, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.3 },
  number: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#20231F',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#20231F',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

export const touch = {
  min: 48,
} as const;

export const motion = {
  fast: 160,
  base: 260,
  slow: 420,
} as const;
