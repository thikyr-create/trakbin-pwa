// StatusPill.tsx
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, sp } from '../../theme/spacing';
import { text } from '../../theme/typography';

const TONES = {
  success: { bg: colors.state.successSoft, fg: colors.state.success },
  warning: { bg: colors.state.warningSoft, fg: colors.state.warning },
  danger: { bg: colors.state.dangerSoft, fg: colors.state.danger },
  info: { bg: colors.state.infoSoft, fg: colors.state.info },
  neutral: { bg: colors.surfaceMuted, fg: colors.text.secondary },
} as const;

const MAP: Record<string, keyof typeof TONES> = {
  active: 'success', completed: 'success', paid: 'success',
  pending: 'warning', scheduled: 'info', in_transit: 'info',
  skipped: 'warning',
  failed: 'danger', cancelled: 'danger', overdue: 'danger', missed: 'danger', inactive: 'neutral',
};

export function StatusPill({ value }: { value: string }) {
  const tone = TONES[MAP[(value || '').toLowerCase()] ?? 'neutral'];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.txt, { color: tone.fg }]}>{(value || 'unknown').replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: sp.x25 ?? 10, paddingVertical: sp.x1, borderRadius: radius.full },
  txt: { ...text.label, fontSize: 10 },
});