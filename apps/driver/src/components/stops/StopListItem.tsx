import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, elevation } from '../../theme/design';

interface Props {
  stop: any;
  isNext: boolean;
  liveDistanceM: number | null;
  legDistanceM: number | null;
  selected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}

function statusChip(stop: any, isNext: boolean) {
  if (stop.status === 'completed') {
    return (
      <View style={[styles.chip, styles.chipCompleted]}>
        <Text style={styles.chipTextCompleted}>COMPLETED</Text>
      </View>
    );
  }
  if (stop.status === 'skipped') {
    return (
      <View style={[styles.chip, styles.chipSkipped]}>
        <Text style={styles.chipTextSkipped}>SKIPPED</Text>
      </View>
    );
  }
  if (isNext) {
    return (
      <View style={[styles.chip, styles.chipNext]}>
        <Text style={styles.chipTextNext}>NEXT</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, styles.chipPending]}>
      <Text style={styles.chipTextPending}>PENDING</Text>
    </View>
  );
}

function badgeColor(stop: any, isNext: boolean) {
  if (stop.status === 'completed') return styles.badgeCompleted;
  if (stop.status === 'skipped') return styles.badgeSkipped;
  if (isNext) return styles.badgeNext;
  return styles.badgePending;
}

export function StopListItem({ stop, isNext, liveDistanceM, legDistanceM, selected, onSelect, onNavigate }: Props) {
  const distanceM = isNext ? liveDistanceM : legDistanceM;
  const etaMin = distanceM != null ? Math.max(1, Math.round((distanceM / 1000 / 25) * 60)) : null;

  const handleSelect = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelect();
  };

  return (
    <View style={[styles.card, isNext && styles.cardNext]}>
      <Pressable onPress={handleSelect} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={[styles.badge, badgeColor(stop, isNext)]}>
          <Text style={styles.badgeText}>{stop.sequence}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.buildingId} numberOfLines={1}>{stop.building_id}</Text>
            {statusChip(stop, isNext)}
          </View>
          <Text style={styles.address} numberOfLines={1}>{stop.address || 'Address unavailable'}</Text>
          {stop.building_type && (
            <View style={styles.typeChip}>
              <Ionicons name="business-outline" size={9} color={colors.text.tertiary} />
              <Text style={styles.typeChipText}>{stop.building_type}</Text>
            </View>
          )}
        </View>
        <View style={styles.distance}>
          <Text style={styles.distanceText}>
            {distanceM != null ? (distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${Math.round(distanceM)} m`) : '—'}
          </Text>
          {etaMin != null && (
            <View style={styles.etaRow}>
              <Ionicons name="time-outline" size={9} color={colors.text.tertiary} />
              <Text style={styles.etaText}>{etaMin} min</Text>
            </View>
          )}
        </View>
      </Pressable>

      {selected && (
        <View style={styles.expanded}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={styles.detailLabelRow}>
                <Ionicons name="location-outline" size={10} color={colors.text.tertiary} />
                <Text style={styles.detailLabel}>ADDRESS</Text>
              </View>
              <Text style={styles.detailValue}>{stop.address || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailCard, styles.detailHalf]}>
                <Text style={styles.detailLabel}>ESTATE</Text>
                <Text style={styles.detailValue}>{stop.estate || 'N/A'}</Text>
              </View>
              <View style={[styles.detailCard, styles.detailHalf]}>
                <Text style={styles.detailLabel}>TYPE</Text>
                <Text style={styles.detailValue}>{stop.building_type || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailCard, styles.detailHalf]}>
                <View style={styles.detailLabelRow}>
                  <Ionicons name="cube-outline" size={10} color={colors.text.tertiary} />
                  <Text style={styles.detailLabel}>UNITS</Text>
                </View>
                <Text style={styles.detailValue}>{stop.number_of_units ?? 'N/A'} {stop.unit_type || ''}</Text>
              </View>
              <View style={[styles.detailCard, styles.detailHalf]}>
                <View style={styles.detailLabelRow}>
                  <Ionicons name="cash-outline" size={10} color={colors.text.tertiary} />
                  <Text style={styles.detailLabel}>PAYMENT</Text>
                </View>
                <Text style={[styles.detailValue, stop.payment_status === 'paid' && styles.paidText]}>
                  {stop.payment_status?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            </View>

            {stop.status === 'skipped' && stop.skip_reason && (
              <View style={[styles.detailCard, styles.skipReasonCard]}>
                <Text style={styles.skipReasonLabel}>SKIP REASON</Text>
                <Text style={styles.skipReasonText}>{stop.skip_reason}</Text>
              </View>
            )}

            {stop.status === 'completed' && stop.completion_time && (
              <View style={[styles.detailCard, styles.completedCard]}>
                <Text style={styles.completedLabel}>COMPLETED AT</Text>
                <Text style={styles.completedText}>
                  {new Date(stop.completion_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.navigateBtn, pressed && styles.pressed]}
              onPress={onNavigate}
              disabled={stop.latitude == null || stop.longitude == null}
            >
              <Ionicons name="navigate" size={16} color={colors.text.inverse} />
              <Text style={styles.navigateText}>VIEW ON MAP</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.neutral[20],
    overflow: 'hidden',
    ...elevation[1],
  },
  cardNext: {
    borderColor: colors.primary[300],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    padding: spacing.x16,
  },
  pressed: {
    backgroundColor: colors.neutral[10],
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.labelLarge,
    color: colors.text.inverse,
  },
  badgeCompleted: {
    backgroundColor: colors.neutral[40],
  },
  badgeSkipped: {
    backgroundColor: colors.state.warning,
  },
  badgeNext: {
    backgroundColor: colors.primary[600],
  },
  badgePending: {
    backgroundColor: colors.surface.containerHighest,
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  buildingId: {
    ...typography.titleSmall,
    color: colors.text.primary,
    flex: 1,
  },
  address: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[10],
    borderRadius: radius.small,
    paddingHorizontal: spacing.x6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: spacing.x6,
  },
  typeChipText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 9,
  },
  distance: {
    alignItems: 'flex-end',
  },
  distanceText: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  etaText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  chip: {
    paddingHorizontal: spacing.x8,
    paddingVertical: 2,
    borderRadius: radius.small,
  },
  chipCompleted: {
    backgroundColor: colors.neutral[10],
  },
  chipTextCompleted: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  chipSkipped: {
    backgroundColor: `${colors.state.warning}20`,
  },
  chipTextSkipped: {
    ...typography.labelSmall,
    color: colors.state.warning,
    fontSize: 10,
  },
  chipNext: {
    backgroundColor: colors.primary[600],
  },
  chipTextNext: {
    ...typography.labelSmall,
    color: colors.text.inverse,
    fontSize: 10,
  },
  chipPending: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  chipTextPending: {
    ...typography.labelSmall,
    color: colors.primary[700],
    fontSize: 10,
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[20],
    backgroundColor: colors.neutral[10],
  },
  detailsGrid: {
    padding: spacing.x16,
    gap: spacing.x8,
  },
  detailCard: {
    backgroundColor: colors.surface.containerHighest,
    borderRadius: radius.medium,
    padding: spacing.x12,
    borderWidth: 1,
    borderColor: colors.neutral[20],
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  detailValue: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.x8,
  },
  detailHalf: {
    flex: 1,
  },
  paidText: {
    color: colors.state.success,
  },
  skipReasonCard: {
    backgroundColor: `${colors.state.warning}10`,
    borderColor: `${colors.state.warning}40`,
  },
  skipReasonLabel: {
    ...typography.labelSmall,
    color: colors.state.warning,
    fontSize: 10,
    marginBottom: 4,
  },
  skipReasonText: {
    ...typography.bodySmall,
    color: colors.state.warning,
  },
  completedCard: {
    backgroundColor: `${colors.state.success}10`,
    borderColor: `${colors.state.success}40`,
  },
  completedLabel: {
    ...typography.labelSmall,
    color: colors.state.success,
    fontSize: 10,
    marginBottom: 4,
  },
  completedText: {
    ...typography.bodySmall,
    color: colors.state.success,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.x8,
    backgroundColor: '#2563eb',
    borderRadius: radius.medium,
    paddingVertical: spacing.x12,
    marginTop: spacing.x8,
    ...elevation[1],
  },
  navigateText: {
    ...typography.labelLarge,
    color: colors.text.inverse,
  },
});