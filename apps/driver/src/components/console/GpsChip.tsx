import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSessionStore } from '../../store/session';
import { useConsoleStore } from '../../store/ui';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

export function GpsChip() {
  const gpsLocation = useSessionStore((s) => s.gpsLocation);
  const gpsAccuracy = useSessionStore((s) => s.gpsAccuracy);
  const sheetState = useConsoleStore((s) => s.sheetState);
  const setDiagOpen = useConsoleStore((s) => s.setDiagOpen);

  const unusable = gpsAccuracy != null && gpsAccuracy > 1000;
  const quality =
    !gpsLocation || unusable || gpsAccuracy == null
      ? null
      : gpsAccuracy <= 15 ? 'High' : gpsAccuracy <= 40 ? 'Medium' : 'Low';
  const bars = quality === 'High' ? 3 : quality === 'Medium' ? 2 : quality === 'Low' ? 1 : 0;

  if (sheetState === 'expanded') return null;

  return (
    <Pressable onLongPress={() => setDiagOpen(true)} delayLongPress={400} style={styles.chip}>
      <View style={[styles.dot, quality ? styles.dotActive : styles.dotAcquiring]} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>GPS</Text>
        <Text style={styles.sub}>
          {quality ? `${quality} accuracy · ±${Math.round(gpsAccuracy!)}m` : 'Acquiring…'}
        </Text>
      </View>
      <View style={styles.bars}>
        {[1, 2, 3].map((b) => (
          <View
            key={b}
            style={[
              styles.bar,
              { height: 4 + b * 3, backgroundColor: b <= bars ? colors.primary[600] : colors.neutral[30] },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x8,
    borderRadius: radius.medium,
    backgroundColor: colors.surface.containerHighest,
    opacity: 0.95,
    ...elevation[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.x8,
  },
  dotActive: {
    backgroundColor: colors.state.success,
  },
  dotAcquiring: {
    backgroundColor: colors.neutral[40],
  },
  textWrap: {
    marginRight: spacing.x12,
  },
  title: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  sub: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 1,
  },
});