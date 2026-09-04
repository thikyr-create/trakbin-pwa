import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../store/session';
import { useProgress } from '../hooks/useProgress';
import { ProgressRing } from '../components/progress/ProgressRing';
import { SummaryRow } from '../components/progress/SummaryRow';
import { colors, typography, spacing, radius, elevation } from '../theme/design';

function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ProgressScreen() {
  const route = useSessionStore((s) => s.route);
  const p = useProgress();

  if (!route) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cube-outline" size={26} color={colors.text.tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No progress yet</Text>
        <Text style={styles.emptyBody}>
          Progress appears once a route is assigned and started.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Today's collection run</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.ringSection}>
          <ProgressRing pct={p.pct} />
          <View style={styles.counts}>
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Completed</Text>
              <Text style={[styles.countValue, styles.countCompleted]}>{p.completed}</Text>
            </View>
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>On route</Text>
              <Text style={[styles.countValue, styles.countInProgress]}>{p.inProgress}</Text>
            </View>
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>Remaining</Text>
              <Text style={[styles.countValue, styles.countRemaining]}>{p.remaining}</Text>
            </View>
            {p.skipped > 0 && (
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Skipped</Text>
                <Text style={[styles.countValue, styles.countSkipped]}>{p.skipped}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>COLLECTION SUMMARY</Text>
        <SummaryRow
          icon="scale-outline"
          label="Waste collected"
          value={p.wasteKg != null ? `${p.wasteKg} kg` : '—'}
        />
        <SummaryRow
          icon="navigate-outline"
          label="Distance travelled"
          value={p.traveledKm != null ? `${p.traveledKm} km` : '—'}
        />
        <SummaryRow
          icon="time-outline"
          label="Time on route"
          value={p.timeOnRouteMin != null ? fmtTime(p.timeOnRouteMin) : '—'}
        />
        <SummaryRow
          icon="checkmark-circle-outline"
          label="Stops on time"
          value={p.onTime ? `${p.onTime.done} / ${p.onTime.total}` : '—'}
        />
        <SummaryRow
          icon="flag-outline"
          label="Success rate"
          value={p.successRate != null ? `${Math.round(p.successRate * 100)}%` : '—'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  content: {
    paddingTop: 110,
    paddingHorizontal: spacing.x16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.x24,
    backgroundColor: colors.primary[50],
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[20],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x12,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.x8,
  },
  emptyBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    marginBottom: spacing.x16,
  },
  title: {
    ...typography.titleLarge,
    color: colors.primary[900],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface.container,
    borderRadius: radius.large,
    padding: spacing.x20,
    marginBottom: spacing.x16,
    ...elevation[1],
  },
  ringSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x20,
  },
  counts: {
    flex: 1,
    gap: spacing.x10,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  countValue: {
    ...typography.titleLarge,
  },
  countCompleted: {
    color: colors.state.success,
  },
  countInProgress: {
    color: '#2563eb',
  },
  countRemaining: {
    color: colors.state.warning,
  },
  countSkipped: {
    color: colors.state.danger,
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.x12,
  },
});