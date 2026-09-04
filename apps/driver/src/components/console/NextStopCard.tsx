import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';
import type { RouteBuilding } from '../../types/routes';

interface Props {
  stop: RouteBuilding;
  isArrived: boolean;
  distanceM: number | null;
  etaMin: number | null;
  onNavigate: () => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export function NextStopCard({ stop, isArrived, distanceM, etaMin, onNavigate, onConfirm, onSkip }: Props) {
  const s: any = stop;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.seqBadge}>
          <Text style={styles.seqText}>{s.sequence ?? '–'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.eyebrow}>{isArrived ? 'Arrived at' : 'Next stop'}</Text>
          <Text style={styles.buildingId} numberOfLines={1}>{s.building_id}</Text>
          <Text style={styles.address} numberOfLines={1}>{s.address || 'Address unavailable'}</Text>
          <View style={styles.chips}>
            {s.building_type && (
              <View style={styles.chip}>
                <Ionicons name="business-outline" size={10} color={colors.text.secondary} />
                <Text style={styles.chipText}>{s.building_type}</Text>
              </View>
            )}
            {s.estate && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{s.estate}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.distance}>
          <Text style={styles.distanceText}>
            {distanceM != null ? (distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${Math.round(distanceM)} m`) : '—'}
          </Text>
          {etaMin != null && <Text style={styles.etaText}>{etaMin} min</Text>}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]} onPress={onNavigate}>
          <Ionicons name="navigate" size={16} color={colors.text.inverse} />
          <Text style={styles.btnText}>NAVIGATE</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]} onPress={onSkip}>
          <Ionicons name="play-skip-forward" size={16} color={colors.text.inverse} />
          <Text style={styles.btnText}>SKIP</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, !isArrived && styles.confirmDisabled, pressed && isArrived && styles.pressed]}
          onPress={onConfirm}
          disabled={!isArrived}
        >
          <Ionicons name="checkmark-circle" size={16} color={isArrived ? colors.text.inverse : colors.text.disabled} />
          <Text style={[styles.btnText, !isArrived && styles.btnTextDisabled]}>CONFIRM</Text>
        </Pressable>
      </View>

      {!isArrived && (
        <Text style={styles.hint}>Confirm unlocks automatically inside the 25 m arrival zone</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.x12 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  seqBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.x12,
    ...elevation[1],
  },
  seqText: { ...typography.labelLarge, color: colors.text.inverse },
  info: { flex: 1 },
  eyebrow: { ...typography.labelSmall, color: colors.text.tertiary, marginBottom: 2 },
  buildingId: { ...typography.titleLarge, color: colors.primary[900] },
  address: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },
  chips: { flexDirection: 'row', gap: spacing.x6, marginTop: spacing.x6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.neutral[20], borderRadius: radius.small,
    paddingHorizontal: spacing.x8, paddingVertical: 2,
  },
  chipText: { ...typography.labelSmall, color: colors.text.secondary },
  distance: { alignItems: 'flex-end' },
  distanceText: { ...typography.titleSmall, color: colors.primary[900] },
  etaText: { ...typography.labelSmall, color: colors.primary[700], marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.x6 },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#2563eb', borderRadius: radius.medium, paddingVertical: spacing.x12,
    ...elevation[1],
  },
  skipBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.state.warning, borderRadius: radius.medium, paddingVertical: spacing.x12,
    ...elevation[1],
  },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.primary[600], borderRadius: radius.medium, paddingVertical: spacing.x12,
    ...elevation[1],
  },
  confirmDisabled: { backgroundColor: colors.neutral[30] },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  btnText: { ...typography.labelLarge, color: colors.text.inverse },
  btnTextDisabled: { color: colors.text.disabled },
  hint: { ...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center', marginTop: -4 },
});