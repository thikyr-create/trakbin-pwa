// lib/features/driver-console/constants/console.ts
import { Map, List, TrendingUp, Activity, Ellipsis } from 'lucide-react';
import type { ConsoleTab } from '../types/console';

export const CONSOLE_TABS: { id: ConsoleTab; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'stops', label: 'Stops', icon: List },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'more', label: 'More', icon: Ellipsis },
];

export const CONSOLE_TOKENS = {
  green: '#059669',
  greenHover: '#10b981',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFB',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
} as const;