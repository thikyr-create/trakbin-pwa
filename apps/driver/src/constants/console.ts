import { Ionicons } from '@expo/vector-icons';

export const CONSOLE_TABS = [
  { id: 'map' as const, label: 'MAP', icon: 'map' as const },
  { id: 'stops' as const, label: 'STOPS', icon: 'list' as const },
  { id: 'progress' as const, label: 'PROGRESS', icon: 'trending-up' as const },
  { id: 'activity' as const, label: 'ACTIVITY', icon: 'pulse' as const },
  { id: 'more' as const, label: 'MORE', icon: 'ellipsis-horizontal' as const },
];