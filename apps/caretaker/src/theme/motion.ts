import { Easing } from 'react-native';

export const motion = {
  durations: { fast: 160, base: 260, slow: 400 },
  stagger: 70,
  spring: { friction: 7, tension: 55 },
  easeOut: Easing.out(Easing.cubic),
} as const;